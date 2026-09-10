/* ============================================
   GY · 天空之隙 — 本地音乐存储层
   双轨存储：
   - 持久轨（File System Access API + IndexedDB 存句柄）——桌面 Chromium + 安全上下文
     曲目刷新/重开浏览器后仍在，播放前可能弹一次授权
   - 会话轨（内存持有 File）——其它浏览器（手机 / Firefox / Safari）
     刷新即失效，UI 需自行提示

   暴露：window.__gyLocalMusic
   ============================================ */

(function () {
  'use strict';

  // ==================== 常量 ====================

  var IDB_NAME = 'gy-local-music';
  var IDB_STORE = 'handles';
  var IDB_META = 'meta';
  var IDB_VERSION = 2;
  var IDB_OPEN_TIMEOUT = 3000;   // IndexedDB 打开超时（隐私模式可能挂起）
  var FILE_READ_TIMEOUT = 2000;  // 单条取文件超时，防句柄读取挂起拖死整轮
  var ALIVE_TIMEOUT = 1500;      // 恢复时存活检测超时（更短，避免拖慢启动）
  var MAX_DEPTH = 4;             // 目录递归深度上限（防误选磁盘根目录时扫太深）

  // 音频扩展名白名单（部分系统上 .flac/.opus 的 MIME 为空或错误，扩展名优先判定）
  var AUDIO_EXT = /\.(mp3|m4a|mp4|m4b|flac|wav|wave|ogg|oga|opus|aac|weba|webm|mp2|aiff?|wma)$/i;
  // MIME 兜底：audio/* 以及浏览器对 m4a/flac 常见的几个非标准写法
  var AUDIO_MIME = /^audio\/|^video\/mp4$|^application\/(ogg|x-mpegurl|vnd\.appl\.mpegurl)$/i;

  // ==================== 工具函数 ====================

  /** 自然排序：文件名中的数字按整数值比较（song2 排在 song10 前） */
  function naturalKey(name) {
    return String(name).toLowerCase().split(/(\d+)/).map(function (p) {
      return /^\d+$/.test(p) ? Number(p) : p;
    });
  }

  function compareNatural(a, b) {
    var ka = naturalKey(a.name), kb = naturalKey(b.name);
    var len = Math.min(ka.length, kb.length);
    for (var i = 0; i < len; i++) {
      var x = ka[i], y = kb[i];
      if (typeof x === 'number' && typeof y === 'number') {
        if (x !== y) return x - y;
      } else {
        var sx = String(x), sy = String(y);
        if (sx !== sy) return sx < sy ? -1 : 1;
      }
    }
    return ka.length - kb.length;
  }

  /** 是否音频文件：扩展名优先，MIME 兜底 */
  function isAudioFile(file) {
    if (!file) return false;
    if (AUDIO_EXT.test(file.name || '')) return true;
    return !!(file.type && AUDIO_MIME.test(file.type));
  }

  /** 显示名：去掉末尾的音频扩展名，与内置曲目的展示方式保持一致 */
  function stripAudioExt(name) {
    return String(name || '').replace(AUDIO_EXT, '') || String(name || '未命名');
  }

  /** 构造带 code 的错误（不依赖 Object.assign，兼容旧浏览器） */
  function makeError(code, message, cause) {
    var err = new Error(message || code);
    err.code = code;
    if (cause) err.cause = cause;
    return err;
  }

  /** 带超时的 promise 等待；超时按 STALE 处理（可取消内部定时器，无残留） */
  function withTimeout(promise, ms, code) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(makeError(code || 'STALE', '本地文件读取超时'));
      }, ms);
      promise.then(function (v) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }, function (e) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(e);
      });
    });
  }

  // ==================== 能力检测 ====================

  var _persistBroken = false; // 曾成功持久化、后续写入失败 → 永久降级，避免写出半条记录

  /** 当前环境能否"跨会话保留"（安全上下文 + File System Access API + IndexedDB） */
  function canPersist() {
    if (_persistBroken) return false;
    if (typeof indexedDB === 'undefined') return false;
    if (!window.isSecureContext) return false;
    if (typeof window.showOpenFilePicker !== 'function') return false;
    return true;
  }

  // ==================== IndexedDB 句柄表 ====================

  var _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;
    var p = new Promise(function (resolve, reject) {
      var timer = null;
      var settled = false;
      var finish = function (fn, arg) {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        fn(arg);
      };
      var req;
      try {
        req = indexedDB.open(IDB_NAME, IDB_VERSION);
      } catch (e) {
        finish(reject, e);
        return;
      }
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
        // 元信息表：目前只存最近选择的文件夹名（用于设置面板展示）
        if (!db.objectStoreNames.contains(IDB_META)) {
          db.createObjectStore(IDB_META, { keyPath: 'k' });
        }
      };
      req.onsuccess = function () {
        var db = req.result;
        // 别的标签页要升级结构时，本连接必须让路，否则对方会一直卡在 blocked
        db.onversionchange = function () {
          try { db.close(); } catch (e) {}
          _dbPromise = null;
        };
        finish(resolve, db);
      };
      req.onerror = function () { finish(reject, req.error || new Error('IndexedDB 打开失败')); };
      req.onblocked = function () { finish(reject, new Error('IndexedDB 被阻塞')); };
      timer = setTimeout(function () { finish(reject, new Error('IndexedDB 打开超时')); }, IDB_OPEN_TIMEOUT);
    });
    // 失败的连接不缓存：否则一次超时会让本次会话后续所有读写都注定失败
    _dbPromise = p.catch(function (e) {
      _dbPromise = null;
      throw e;
    });
    return _dbPromise;
  }

  /** 读取全部句柄记录 */
  function idbGetAll() {
    return openDB().then(function (db) {
      // 旧版本留下的库可能没有这张表：缺表按"没有记录"处理，不能抛
      if (!db.objectStoreNames.contains(IDB_STORE)) return [];
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(IDB_STORE, 'readonly');
        var req = tx.objectStore(IDB_STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error || new Error('读取句柄失败')); };
      });
    });
  }

  /**
   * 写入一条句柄记录。
   * 浏览器不支持句柄序列化时 put 会抛 DataCloneError → 返回 false 并永久降级。
   */
  function idbPut(record) {
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx;
        try {
          tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(record);
        } catch (e) {
          _persistBroken = true;   // 当前环境写不进句柄
          resolve(false);
          return;
        }
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
        tx.onabort = function () { resolve(false); };
      });
    }).catch(function () {
      return false;
    });
  }

  function idbDelete(id) {
    if (!canPersist()) return Promise.resolve();
    return openDB().then(function (db) {
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).delete(id);
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
          tx.onabort = function () { resolve(); };
        } catch (e) {
          resolve();
        }
      });
    }).catch(function () {});
  }

  /** 元信息读写（当前只用于记录最近选择的文件夹名） */
  function idbMetaSet(key, value) {
    if (!canPersist()) return Promise.resolve();
    return openDB().then(function (db) {
      if (!db.objectStoreNames.contains(IDB_META)) return;
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_META, 'readwrite');
          tx.objectStore(IDB_META).put({ k: key, v: value });
          tx.oncomplete = function () { resolve(); };
          tx.onerror = function () { resolve(); };
          tx.onabort = function () { resolve(); };
        } catch (e) {
          resolve();
        }
      });
    }).catch(function () {});
  }

  function idbMetaGet(key) {
    if (!canPersist()) return Promise.resolve('');
    return openDB().then(function (db) {
      if (!db.objectStoreNames.contains(IDB_META)) return '';
      return new Promise(function (resolve) {
        try {
          var tx = db.transaction(IDB_META, 'readonly');
          var rq = tx.objectStore(IDB_META).get(key);
          rq.onsuccess = function () { resolve(rq.result ? rq.result.v : ''); };
          rq.onerror = function () { resolve(''); };
        } catch (e) {
          resolve('');
        }
      });
    }).catch(function () { return ''; });
  }

  /** 清空一张表；返回是否清成功 */
  function clearStore(db, name) {
    return new Promise(function (resolve) {
      var tx;
      try {
        tx = db.transaction(name, 'readwrite');
        tx.objectStore(name).clear();
      } catch (e) {
        resolve(false);
        return;
      }
      tx.oncomplete = function () { resolve(true); };
      tx.onerror = function () { resolve(false); };
      tx.onabort = function () { resolve(false); };
    });
  }

  /** 清空当前库里**所有**表（不按表名挑），逐表独立事务，一张表失败不影响其它表 */
  function clearEveryStore(db) {
    var names = [];
    for (var i = 0; i < db.objectStoreNames.length; i++) names.push(db.objectStoreNames[i]);
    return Promise.all(names.map(function (n) { return clearStore(db, n); }));
  }

  /**
   * 按"当前已有版本"连上库（不触发结构升级）。
   * 结构升级被别的标签页挡住时，靠它把记录清干净。
   */
  function openDBExisting() {
    return new Promise(function (resolve) {
      var req;
      var done = false;
      var finish = function (db) {
        if (done) return;
        done = true;
        resolve(db);
      };
      try {
        req = indexedDB.open(IDB_NAME);
      } catch (e) {
        finish(null);
        return;
      }
      req.onsuccess = function () { finish(req.result); };
      req.onerror = function () { finish(null); };
      req.onblocked = function () { finish(null); };
      setTimeout(function () { finish(null); }, IDB_OPEN_TIMEOUT);
    });
  }

  /**
   * 清空全部持久化记录。
   * 逐表清而不是按表名提交一次事务 —— 旧版本遗留的库表结构可能对不上，
   * 那样事务会直接抛错并被吞掉，表现为"清除成功"但刷新后曲目复活。
   */
  function idbClearAll() {
    if (!canPersist()) return Promise.resolve();
    return openDB().then(function (db) {
      return clearEveryStore(db);
    }).catch(function () {
      return openDBExisting().then(function (db) {
        if (!db) return null;
        return clearEveryStore(db).then(function () {
          try { db.close(); } catch (e) {}
        });
      });
    });
  }

  // ==================== 条目表（会话内镜像） ====================

  var _entries = [];   // 有序条目数组，只包含**可用**曲目（失效的在恢复阶段就被剔除）
  var _byId = {};      // id → entry
  var _seq = 0;
  var _pathName = '';  // 最近一次选择的文件夹名（浏览器不允许读取绝对路径，仅有这一层信息）

  function newId() {
    _seq += 1;
    return 'L' + Date.now().toString(36) + _seq.toString(36);
  }

  function makeEntry(name, handle, id) {
    return {
      id: id || newId(),
      name: stripAudioExt(name),
      handle: handle,   // { kind:'fsa', handle } 或 { kind:'memory', file }
      state: 'ok',      // 'ok' | 'stale'（stale 不进入播放列表）
      path: _pathName   // 该条目来自哪个文件夹（用于设置面板展示）
    };
  }

  function remember(entry) {
    _byId[entry.id] = entry;
    _entries.push(entry);
    return entry;
  }

  function sortEntries() {
    _entries.sort(compareNatural);
  }

  // ==================== 授权与取文件 ====================

  /**
   * 确保句柄可用（必要时请求授权）。
   * requestPermission 需要用户手势：调用点必须位于点击/拖拽的调用栈内，
   * 且此前不得有跨出微任务边界的 await（如定时器、网络等待）。
   */
  function ensurePermission(fsHandle) {
    if (!fsHandle || typeof fsHandle.queryPermission !== 'function') return Promise.resolve(true);
    return fsHandle.queryPermission({ mode: 'read' }).then(function (state) {
      if (state === 'granted') return true;
      if (typeof fsHandle.requestPermission !== 'function') return false;
      return fsHandle.requestPermission({ mode: 'read' }).then(function (next) {
        return next === 'granted';
      });
    }).catch(function () {
      return false;
    });
  }

  /**
   * 取到可用于 createObjectURL 的 File。
   * 句柄失效（文件被移动/删除）或授权被拒 → 抛 STALE。
   */
  function getFile(entry) {
    if (!entry || !entry.handle) return Promise.reject(makeError('STALE', '条目无效'));

    if (entry.handle.kind === 'memory') {
      if (!entry.handle.file) return Promise.reject(makeError('STALE', '文件已不可用'));
      return Promise.resolve(entry.handle.file);
    }

    var fsHandle = entry.handle.handle;
    if (!fsHandle) return Promise.reject(makeError('STALE', '句柄缺失'));

    return ensurePermission(fsHandle).then(function (ok) {
      if (!ok) throw makeError('STALE', '未获得文件访问授权');
      return withTimeout(fsHandle.getFile(), FILE_READ_TIMEOUT, 'STALE');
    }).catch(function (e) {
      if (e && e.code === 'STALE') throw e;
      throw makeError('STALE', '本地文件已失效', e);
    });
  }

  // ==================== 恢复（刷新后重建列表） ====================

  /**
   * 恢复持久化的本地曲目。
   * 返回 { entries, persisted, dropped, needAuth }：
   * - entries：**仅含可用曲目**（失效的不进列表，符合"自动不再显示"）
   * - dropped：本次因"文件不存在"被剔除的条数（同时已从存储清理）
   * - needAuth：条数，表示句柄还在但需要用户重新授权的条目数（列表里仍会显示）
   * - persisted=false → 会话轨，UI 需提示"仅本次浏览有效"
   * 恢复过程绝不静默请求授权（会连环弹窗），只做不需要授权的存活检测。
   */
  function restore() {
    if (!canPersist()) return Promise.resolve({ entries: [], persisted: false, dropped: 0, needAuth: 0 });

    return Promise.all([idbGetAll(), idbMetaGet('pathName')]).then(function (res) {
      var records = res[0];
      _pathName = res[1] || '';
      if (!records.length) return { entries: [], persisted: true, dropped: 0, needAuth: 0 };
      var droppedIds = [];
      var needAuth = 0;

      return Promise.all(records.map(function (rec) {
        var entry = makeEntry(rec.name, { kind: 'fsa', handle: rec.handle }, rec.id);
        var fsHandle = rec.handle;

        // 先判断是否只是"待授权"：是则保留条目（播放时再请求授权）
        var permCheck = (fsHandle && typeof fsHandle.queryPermission === 'function')
          ? fsHandle.queryPermission({ mode: 'read' }).catch(function () { return 'prompt'; })
          : Promise.resolve('granted');

        return permCheck.then(function (state) {
          if (state !== 'granted') {
            needAuth += 1;
            remember(entry);          // 保留：可能只是权限过期，文件本身还在
            return null;
          }
          // 已授权 → 真正读一下，读不到说明文件已被移走/删除 → 不进列表并清理记录
          return withTimeout(fsHandle.getFile(), ALIVE_TIMEOUT).then(function () {
            remember(entry);
            return null;
          }, function () {
            droppedIds.push(entry.id);
            return null;
          });
        }).catch(function () {
          droppedIds.push(entry.id);
          return null;
        });
      })).then(function () {
        sortEntries();
        // 清理已失效的记录（避免存储里堆积永不显示的条目）
        droppedIds.forEach(function (id) { idbDelete(id); });
        return { entries: _entries.slice(), persisted: true, dropped: droppedIds.length, needAuth: needAuth };
      });
    }).catch(function () {
      return { entries: [], persisted: false, dropped: 0, needAuth: 0 };
    });
  }

  // ==================== 导入 ====================

  /**
   * 记录本次导入的来源名（浏览器只给得到文件夹名，拿不到绝对路径）。
   * 目录导入 → 文件夹名；多选文件 → 留空（多个来源没有统一路径，UI 退化为只显示曲目数）
   */
  function setPathName(name) {
    _pathName = name || '';
    idbMetaSet('pathName', _pathName);
  }

  /** 由 File 构造会话轨条目；带 webkitRelativePath 时取最后一段作显示名 */
  function entryFromFile(file) {
    var name = file.name || '未命名';
    if (file.webkitRelativePath) {
      var seg = String(file.webkitRelativePath).split('/').pop();
      if (seg) name = seg;
    }
    return makeEntry(name, { kind: 'memory', file: file });
  }

  /**
   * 把一批 FileSystemFileHandle 变成持久轨条目。
   * 顺序与传入顺序无关（最终统一自然排序），因此内部可并行读取。
   */
  function addFsHandles(handles) {
    var picked = [];
    var seen = {};
    handles.forEach(function (h) {
      if (!h || h.kind !== 'file') return;
      var key = (h.name || '') + '|' + picked.length;
      if (seen[key]) return;      // 同批内同名文件去重
      seen[key] = true;
      picked.push(h);
    });
    if (!picked.length) return Promise.resolve([]);

    var tasks = picked.map(function (h) {
      var entry = makeEntry(h.name || '未命名', { kind: 'fsa', handle: h });
      return h.getFile().then(function (f) {
        if (!isAudioFile(f)) return null;   // 非音频不列表
        return idbPut({ id: entry.id, name: entry.name, handle: h, addedAt: Date.now() })
          .then(function (ok) {
            if (!ok) entry.handle = { kind: 'memory', file: f };  // 写不进 DB → 本次退化为会话轨
            remember(entry);
            return entry;
          });
      }).catch(function () {
        return null;    // 单个句柄读取失败不影响其余
      });
    });

    return Promise.all(tasks).then(function (results) {
      sortEntries();
      return results.filter(function (e) { return !!e; });
    });
  }

  /** 把一批 File 加入会话轨，按文件名自然排序 */
  function addPlainFiles(files) {
    var list = [];
    for (var i = 0; i < files.length; i++) {
      if (isAudioFile(files[i])) list.push(files[i]);
    }
    list.sort(function (a, b) {
      return compareNatural({ name: a.name }, { name: b.name });
    });
    var added = list.map(function (f) { return remember(entryFromFile(f)); });
    sortEntries();
    return added;
  }

  /** 统一导入入口：按当前环境走持久轨或会话轨 */
  function addFiles(files) {
    if (!files || !files.length) return Promise.resolve([]);
    setPathName('');   // 多选文件没有统一来源，清掉上次的文件夹名，避免设置面板显示过时路径
    return Promise.resolve(addPlainFiles(files));
  }

  /** File System Access：多选文件。必须在用户手势调用栈内直接调用（不要先 await 别的东西） */
  function pickFiles() {
    if (typeof window.showOpenFilePicker !== 'function') {
      return Promise.reject(makeError('UNSUPPORTED', '当前浏览器不支持文件选择器'));
    }
    return window.showOpenFilePicker({
      multiple: true,
      types: [{
        description: '音频文件',
        accept: { 'audio/*': ['.mp3', '.m4a', '.flac', '.wav', '.ogg', '.opus', '.aac', '.mp4'] }
      }]
    }).then(function (handles) {
      return addFsHandles(handles);
    }).catch(function (e) {
      if (e && (e.name === 'AbortError' || e.code === 'ABORT')) {
        return Promise.reject(makeError('ABORT', '已取消'));
      }
      throw e;
    });
  }

  /** File System Access：选目录并递归收集音频文件 */
  function pickDirectory() {
    if (typeof window.showDirectoryPicker !== 'function') {
      return Promise.reject(makeError('UNSUPPORTED', '当前浏览器不支持文件夹选择器'));
    }
    return window.showDirectoryPicker({ mode: 'read' }).then(function (dir) {
      // 目录名就是浏览器能给到的"路径"信息（绝对路径出于安全拿不到）
      setPathName(dir.name || '');
      return collectAudioHandles(dir, 0);
    }).then(function (handles) {
      return addFsHandles(handles);
    }).catch(function (e) {
      if (e && (e.name === 'AbortError' || e.code === 'ABORT')) {
        return Promise.reject(makeError('ABORT', '已取消'));
      }
      throw e;
    });
  }

  /** 递归读取目录句柄下的音频文件句柄（跳过隐藏项） */
  function collectAudioHandles(dirHandle, depth) {
    if (depth > MAX_DEPTH) return Promise.resolve([]);

    var out = [];
    var next = function (iterator) {
      return iterator.next().then(function (res) {
        if (res.done) return out;
        var handle = res.value;
        if (handle.name && handle.name.charAt(0) === '.') return next(iterator);
        if (handle.kind === 'file') {
          if (AUDIO_EXT.test(handle.name)) out.push(handle);
          return next(iterator);
        }
        if (handle.kind === 'directory') {
          return collectAudioHandles(handle, depth + 1).then(function (sub) {
            out = out.concat(sub);
            return next(iterator);
          });
        }
        return next(iterator);
      });
    };

    return Promise.resolve(dirHandle.values()).then(next).catch(function () {
      return out;   // 单个子目录读取失败不影响已收集的部分
    });
  }


  /** 移除一条本地曲目：内存镜像 + IndexedDB 双删 */
  function remove(id) {
    var target = _byId[id];
    if (target) {
      var idx = _entries.indexOf(target);
      if (idx !== -1) _entries.splice(idx, 1);
      delete _byId[id];
    }
    return idbDelete(id);
  }

  /**
   * 清空全部本地音乐：内存条目 + IndexedDB 记录 + 文件夹名 + 已建的 blob URL。
   * 用于"修改路径"——换来源时整批替换，旧列表不再保留。
   */
  function clearAll() {
    _entries = [];
    _byId = {};
    _pathName = '';
    releaseBlobs();
    return idbClearAll();
  }

  /** 最近一次导入的来源名（文件夹名；多选文件时为空串） */
  function getPathName() {
    return _pathName;
  }

  /** blob URL 登记表：只治理本模块创建的 URL，不误伤其它模块（如 Live2D） */
  var _blobUrls = [];

  /** 由 File 创建并登记 blob URL */
  function createBlobUrl(file) {
    var url = URL.createObjectURL(file);
    _blobUrls.push(url);
    return url;
  }

  /** 撤销单个 URL（换曲时回收，仅当它是本模块创建的） */
  function revokeBlobUrl(url) {
    if (!url) return;
    var idx = _blobUrls.indexOf(url);
    if (idx === -1) return;   // 不是本模块创建的，不动
    _blobUrls.splice(idx, 1);
    try { URL.revokeObjectURL(url); } catch (e) {}
  }

  /** 统一撤销全部（页面离开时调用） */
  function releaseBlobs() {
    _blobUrls.forEach(function (u) {
      try { URL.revokeObjectURL(u); } catch (e) {}
    });
    _blobUrls = [];
  }

  if (typeof window.addEventListener === 'function') {
    // pagehide 在移动端 / Safari 上比 beforeunload 可靠
    window.addEventListener('pagehide', releaseBlobs);
  }

  // ==================== 对外接口 ====================

  window.__gyLocalMusic = {
    canPersist: canPersist,
    restore: restore,
    pickFiles: pickFiles,
    pickDirectory: pickDirectory,
    addFiles: addFiles,
    getFile: getFile,
    createBlobUrl: createBlobUrl,
    revokeBlobUrl: revokeBlobUrl,
    releaseBlobs: releaseBlobs,
    clearAll: clearAll,
    getPathName: getPathName,
    remove: remove,
    isAudioFile: isAudioFile,
    entries: function () { return _entries.slice(); }
  };
})();
