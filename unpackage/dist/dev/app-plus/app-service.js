if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LAUNCH = "onLaunch";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createLifeCycleHook = (lifecycle, flag = 0) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onHide = /* @__PURE__ */ createLifeCycleHook(
    ON_HIDE,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onLaunch = /* @__PURE__ */ createLifeCycleHook(
    ON_LAUNCH,
    1
    /* HookFlags.APP */
  );
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const HR_TOLERANCE = 3;
  const CATEGORY_SWITCH_DELAY = 3e4;
  const _sfc_main$1 = {
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const isConnected = vue.ref(false);
      const scanning = vue.ref(false);
      const batteryLevel = vue.ref(100);
      const connectedDeviceName = vue.ref("");
      const inputMessage = vue.ref("");
      const discoveredDevices = vue.ref([]);
      let scanStopTimer = null;
      const dataList = vue.ref([]);
      const sensorData = vue.reactive({
        heartRate: null,
        spo2: null,
        steps: null,
        temperature: null
      });
      const currentHeartRate = vue.ref(null);
      const currentMusicCategory = vue.ref("none");
      const manualOverride = vue.ref(false);
      const manualCategory = vue.ref("slow");
      const isPlaying = vue.ref(false);
      const currentTrackName = vue.ref("");
      let lastHeartRate = null;
      let pendingCategory = null;
      let pendingStartTime = null;
      const hrThresholds = vue.reactive({
        slow: { min: 60, max: 80 },
        mid: { min: 80, max: 96 },
        midfast: { min: 96, max: 120 },
        fast: { min: 120, max: 144 },
        veryfast: { min: 144, max: 999 }
      });
      const musicLibrary = {
        slow: {
          folder: "/Music/000-079_BPM_slow/",
          bpmList: "/Music/000-079_BPM_slow/bpm_list.txt",
          tracks: [],
          // { file, bpm }
          loaded: false,
          currentIndex: -1
        },
        mid: {
          folder: "/Music/080-099_BPM_mid/",
          bpmList: "/Music/080-099_BPM_mid/bpm_list.txt",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        midfast: {
          folder: "/Music/100-119_BPM_midfast/",
          bpmList: "/Music/100-119_BPM_midfast/bpm_list.txt",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        fast: {
          folder: "/Music/120-139_BPM_fast/",
          bpmList: "/Music/120-139_BPM_fast/bpm_list.txt",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        veryfast: {
          folder: "/Music/140+_BPM_veryfast/",
          bpmList: "/Music/140+_BPM_veryfast/bpm_list.txt",
          tracks: [],
          loaded: false,
          currentIndex: -1
        }
      };
      let audioCtx = null;
      const musicCategoryOptions = [
        { value: "slow", label: "慢速 slow" },
        { value: "mid", label: "中速 mid" },
        { value: "midfast", label: "中快 midfast" },
        { value: "fast", label: "快速 fast" },
        { value: "veryfast", label: "超快 veryfast" }
      ];
      const thresholdDisplayList = vue.computed(() => [
        { key: "slow", label: "Slow", rangeText: `${hrThresholds.slow.min}-${hrThresholds.slow.max}` },
        { key: "mid", label: "Mid", rangeText: `${hrThresholds.mid.min}-${hrThresholds.mid.max}` },
        { key: "midfast", label: "Mid-fast", rangeText: `${hrThresholds.midfast.min}-${hrThresholds.midfast.max}` },
        { key: "fast", label: "Fast", rangeText: `${hrThresholds.fast.min}-${hrThresholds.fast.max}` },
        { key: "veryfast", label: "Very fast", rangeText: `${hrThresholds.veryfast.min}+` }
      ]);
      const currentMusicCategoryLabel = vue.computed(() => {
        const map = {
          none: "未播放",
          slow: "慢速 slow",
          mid: "中速 mid",
          midfast: "中快 midfast",
          fast: "快速 fast",
          veryfast: "超快 veryfast"
        };
        return map[currentMusicCategory.value] || "未播放";
      });
      const manualCategoryLabel = vue.computed(() => {
        const found = musicCategoryOptions.find((i) => i.value === manualCategory.value);
        return found ? found.label : "请选择";
      });
      const canControlTrack = vue.computed(() => {
        const cfg = musicLibrary[currentMusicCategory.value];
        return !!(cfg && cfg.tracks && cfg.tracks.length > 0 && cfg.currentIndex >= 0);
      });
      const canStartPlay = vue.computed(() => {
        const cfg = musicLibrary[currentMusicCategory.value];
        return !!(cfg && cfg.tracks && cfg.tracks.length > 0);
      });
      const quickCommands = [
        { name: "获取心率", command: "GET_HR" },
        { name: "获取步数", command: "GET_STEPS" },
        { name: "同步时间", command: "SYNC_TIME" },
        { name: "设备信息", command: "GET_INFO" }
      ];
      let bluetoothDevice = null;
      let writeServiceId = null;
      let writeCharId = null;
      let notifyServiceId = null;
      let notifyCharId = null;
      vue.onMounted(() => {
        initBluetooth();
        startBatteryMonitoring();
      });
      vue.onUnmounted(() => {
        disconnect();
      });
      const initBluetooth = async () => {
        try {
          await new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
              success: resolve,
              fail: reject
            });
          });
          formatAppLog("log", "at pages/index/index.vue:315", "蓝牙适配器初始化成功");
          addLog("系统", "蓝牙适配器已就绪", "system");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:318", "蓝牙初始化失败", error);
          uni.showToast({
            title: "蓝牙初始化失败",
            icon: "none"
          });
        }
      };
      const scanDevices = async () => {
        if (scanning.value)
          return;
        scanning.value = true;
        addLog("系统", "开始扫描设备...");
        discoveredDevices.value = [];
        try {
          await new Promise((resolve, reject) => {
            uni.startBluetoothDevicesDiscovery({
              allowDuplicatesKey: false,
              success: resolve,
              fail: reject
            });
          });
          uni.onBluetoothDeviceFound((devices) => {
            const list = devices.devices || [];
            list.forEach((d) => {
              const name = d.name || d.localName || "";
              if (!name)
                return;
              if (!discoveredDevices.value.find((x) => x.deviceId === d.deviceId)) {
                discoveredDevices.value.push({ deviceId: d.deviceId, name });
              }
            });
          });
          scanStopTimer && clearTimeout(scanStopTimer);
          scanStopTimer = setTimeout(() => {
            try {
              uni.stopBluetoothDevicesDiscovery();
            } catch (e) {
            }
            scanning.value = false;
            addLog("系统", `设备扫描完成，发现 ${discoveredDevices.value.length} 台`, "system");
            if (discoveredDevices.value.length > 0) {
              uni.showActionSheet({
                itemList: discoveredDevices.value.map((d) => d.name),
                success: (res) => {
                  const idx = res.tapIndex;
                  const dev = discoveredDevices.value[idx];
                  if (dev)
                    connectToDevice(dev);
                }
              });
            } else {
              uni.showToast({ title: "未发现设备", icon: "none" });
            }
          }, 6e3);
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:376", "扫描设备失败", error);
          scanning.value = false;
          uni.showToast({
            title: "扫描失败",
            icon: "none"
          });
        }
      };
      const connectToDevice = async (device) => {
        try {
          addLog("系统", `尝试连接: ${device.name}`, "system");
          await new Promise((resolve, reject) => {
            uni.createBLEConnection({
              deviceId: device.deviceId,
              timeout: 15e3,
              success: resolve,
              fail: reject
            });
          });
          bluetoothDevice = device;
          isConnected.value = true;
          connectedDeviceName.value = device.name;
          const servicesRes = await new Promise((resolve, reject) => {
            uni.getBLEDeviceServices({
              deviceId: device.deviceId,
              success: resolve,
              fail: reject
            });
          });
          const services = servicesRes.services || [];
          writeServiceId = null;
          writeCharId = null;
          notifyServiceId = null;
          notifyCharId = null;
          for (const svc of services) {
            const charsRes = await new Promise((resolve, reject) => {
              uni.getBLEDeviceCharacteristics({
                deviceId: device.deviceId,
                serviceId: svc.uuid,
                success: resolve,
                fail: reject
              });
            });
            const chars = charsRes.characteristics || [];
            chars.forEach((ch) => {
              const props = ch.properties || {};
              if (!writeCharId && (props.write || props.writeNoResponse)) {
                writeServiceId = svc.uuid;
                writeCharId = ch.uuid;
              }
              if (!notifyCharId && (props.notify || props.indicate)) {
                notifyServiceId = svc.uuid;
                notifyCharId = ch.uuid;
              }
            });
          }
          if (notifyServiceId && notifyCharId) {
            await new Promise((resolve, reject) => {
              uni.notifyBLECharacteristicValueChange({
                deviceId: device.deviceId,
                serviceId: notifyServiceId,
                characteristicId: notifyCharId,
                state: true,
                success: resolve,
                fail: reject
              });
            });
            uni.onBLECharacteristicValueChange((res) => {
              const data = ab2str(res.value);
              handleReceivedData(data);
            });
          } else {
            addLog("系统", "未找到可通知的特征，可能无法接收数据", "system");
          }
          addLog("系统", "设备连接成功", "system");
          uni.showToast({
            title: "连接成功",
            icon: "success"
          });
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:467", "连接设备失败", error);
          uni.showToast({
            title: "连接失败",
            icon: "none"
          });
        }
      };
      const disconnect = async () => {
        if (bluetoothDevice) {
          try {
            await new Promise((resolve) => {
              uni.closeBLEConnection({
                deviceId: bluetoothDevice.deviceId,
                complete: resolve
              });
            });
          } catch (error) {
            formatAppLog("error", "at pages/index/index.vue:486", "断开连接失败", error);
          }
        }
        isConnected.value = false;
        connectedDeviceName.value = "";
        bluetoothDevice = null;
        writeServiceId = null;
        writeCharId = null;
        notifyServiceId = null;
        notifyCharId = null;
        addLog("系统", "设备已断开");
      };
      const sendData = async () => {
        if (!inputMessage.value.trim() || !isConnected.value)
          return;
        try {
          if (!writeServiceId || !writeCharId) {
            uni.showToast({ title: "未找到可写特征", icon: "none" });
            return;
          }
          const text = inputMessage.value;
          const buffer = str2ab(text);
          const maxLen = 20;
          const u8 = new Uint8Array(buffer);
          for (let i = 0; i < u8.length; i += maxLen) {
            const chunk = u8.slice(i, i + maxLen);
            await new Promise((resolve, reject) => {
              uni.writeBLECharacteristicValue({
                deviceId: bluetoothDevice.deviceId,
                serviceId: writeServiceId,
                characteristicId: writeCharId,
                value: chunk.buffer,
                success: resolve,
                fail: reject
              });
            });
            await delay(20);
          }
          addLog(text, "sent");
          inputMessage.value = "";
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:532", "发送数据失败", error);
          uni.showToast({
            title: "发送失败",
            icon: "none"
          });
        }
      };
      const sendQuickCommand = (cmd) => {
        inputMessage.value = cmd.command;
        sendData();
      };
      const handleReceivedData = (data) => {
        addLog(data, "received");
        if (data.includes("HR:")) {
          const hrStr = data.split(":")[1];
          const hr = parseInt(hrStr, 10);
          if (!isNaN(hr)) {
            sensorData.heartRate = hr;
            onHeartRateUpdate(hr);
          }
        } else if (/Heart\s*Rate/i.test(data)) {
          const match = data.match(/Heart\s*Rate\s*:(\d+)/i);
          if (match) {
            const hr = parseInt(match[1], 10);
            if (!isNaN(hr)) {
              sensorData.heartRate = hr;
              onHeartRateUpdate(hr);
            }
          }
        } else if (data.includes("SPO2:")) {
          sensorData.spo2 = data.split(":")[1];
        } else if (data.includes("STEPS:")) {
          sensorData.steps = data.split(":")[1];
        } else if (data.includes("TEMP:")) {
          sensorData.temperature = data.split(":")[1];
        }
      };
      const addLog = (content, type = "received") => {
        const now = /* @__PURE__ */ new Date();
        const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        dataList.value.unshift({
          content,
          type,
          time
        });
        if (dataList.value.length > 100) {
          dataList.value = dataList.value.slice(0, 100);
        }
      };
      const startBatteryMonitoring = () => {
        setInterval(() => {
          batteryLevel.value = Math.max(10, batteryLevel.value - 0.1);
        }, 6e4);
      };
      const str2ab = (str) => {
        if (typeof TextEncoder !== "undefined") {
          return new TextEncoder().encode(str).buffer;
        } else {
          const buffer = new ArrayBuffer(str.length);
          const dataView = new DataView(buffer);
          for (let i = 0; i < str.length; i++) {
            dataView.setUint8(i, str.charCodeAt(i));
          }
          return buffer;
        }
      };
      const ab2str = (buffer) => {
        if (typeof TextDecoder !== "undefined") {
          return new TextDecoder("utf-8").decode(new Uint8Array(buffer));
        } else {
          return String.fromCharCode.apply(null, new Uint8Array(buffer));
        }
      };
      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const onHeartRateUpdate = (hr) => {
        currentHeartRate.value = hr;
        if (lastHeartRate !== null && Math.abs(hr - lastHeartRate) <= HR_TOLERANCE) {
          lastHeartRate = hr;
          return;
        }
        lastHeartRate = hr;
        const targetCategory = getCategoryByHeartRate(hr);
        if (!targetCategory)
          return;
        if (manualOverride.value)
          return;
        const now = Date.now();
        if (targetCategory === currentMusicCategory.value) {
          pendingCategory = null;
          pendingStartTime = null;
          return;
        }
        if (pendingCategory !== targetCategory) {
          pendingCategory = targetCategory;
          pendingStartTime = now;
          return;
        }
        if (now - pendingStartTime >= CATEGORY_SWITCH_DELAY) {
          switchMusicCategory(targetCategory);
          pendingCategory = null;
          pendingStartTime = null;
        }
      };
      const getCategoryByHeartRate = (hr) => {
        if (hr < hrThresholds.slow.min) {
          return "none";
        }
        if (hr >= hrThresholds.slow.min && hr < hrThresholds.slow.max) {
          return "slow";
        }
        if (hr >= hrThresholds.mid.min && hr < hrThresholds.mid.max) {
          return "mid";
        }
        if (hr >= hrThresholds.midfast.min && hr < hrThresholds.midfast.max) {
          return "midfast";
        }
        if (hr >= hrThresholds.fast.min && hr < hrThresholds.fast.max) {
          return "fast";
        }
        if (hr >= hrThresholds.veryfast.min) {
          return "veryfast";
        }
        return "none";
      };
      const ensureAudioContext = () => {
        if (!audioCtx) {
          audioCtx = uni.createInnerAudioContext();
          audioCtx.autoplay = false;
          audioCtx.loop = true;
          audioCtx.onPlay(() => {
            isPlaying.value = true;
          });
          audioCtx.onPause(() => {
            isPlaying.value = false;
          });
          audioCtx.onStop(() => {
            isPlaying.value = false;
          });
          audioCtx.onEnded(() => {
            isPlaying.value = false;
          });
          audioCtx.onError((err) => {
            formatAppLog("error", "at pages/index/index.vue:706", "音乐播放错误", err);
            addLog("系统", "音乐播放出错");
            isPlaying.value = false;
          });
        }
      };
      const loadCategoryTracks = (category) => {
        const cfg = musicLibrary[category];
        if (!cfg || !cfg.bpmList) {
          return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
          uni.request({
            url: cfg.bpmList,
            method: "GET",
            success: (res) => {
              const text = typeof res.data === "string" ? res.data : "";
              const lines = text.split(/\r?\n/).filter((l) => l.trim());
              const tracks = [];
              for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line)
                  continue;
                const parts = line.split(/\s+/);
                const bpmStr = parts[parts.length - 1];
                const bpm = parseFloat(bpmStr);
                const file = parts.slice(0, parts.length - 1).join(" ");
                if (file && !isNaN(bpm)) {
                  tracks.push({ file, bpm });
                }
              }
              cfg.tracks = tracks;
              cfg.loaded = true;
              resolve();
            },
            fail: (err) => {
              formatAppLog("error", "at pages/index/index.vue:745", "加载 bpm_list 失败", category, err);
              addLog("系统", `加载 ${category} 的 bpm_list 失败`);
              reject(err);
            }
          });
        });
      };
      const switchMusicCategory = async (category) => {
        const cfg = musicLibrary[category];
        if (!cfg) {
          addLog("系统", `未知音乐类型: ${category}`);
          return;
        }
        if (!cfg.loaded) {
          try {
            await loadCategoryTracks(category);
          } catch (e) {
            currentMusicCategory.value = "none";
            return;
          }
        }
        if (!cfg.tracks || cfg.tracks.length === 0) {
          addLog("系统", `当前类型(${category})暂无可用曲目`);
          currentMusicCategory.value = "none";
          return;
        }
        const idx = Math.floor(Math.random() * cfg.tracks.length);
        await playTrackByIndex(category, idx);
      };
      const playTrackByIndex = async (category, index) => {
        const cfg = musicLibrary[category];
        if (!cfg || !cfg.tracks || cfg.tracks.length === 0) {
          return;
        }
        const total = cfg.tracks.length;
        if (total === 0)
          return;
        let idx = index;
        if (idx < 0)
          idx = total - 1;
        if (idx >= total)
          idx = 0;
        cfg.currentIndex = idx;
        const track = cfg.tracks[idx];
        ensureAudioContext();
        audioCtx.src = cfg.folder + track.file;
        audioCtx.play();
        currentMusicCategory.value = category;
        currentTrackName.value = track.file;
        addLog("系统", `切换至 ${category} 类型音乐：${track.file}（${track.bpm} BPM）`);
      };
      const toggleManualOverride = (e) => {
        manualOverride.value = !e.detail.value ? true : false;
        if (!manualOverride.value && currentHeartRate.value !== null) {
          const cat = getCategoryByHeartRate(currentHeartRate.value);
          if (cat && cat !== "none") {
            switchMusicCategory(cat);
          }
        }
      };
      const onManualCategoryChange = (e) => {
        const idx = Number(e.detail.value);
        const item = musicCategoryOptions[idx];
        if (!item)
          return;
        manualCategory.value = item.value;
        manualOverride.value = true;
        switchMusicCategory(item.value);
      };
      const togglePlayPause = async () => {
        ensureAudioContext();
        const cfg = musicLibrary[currentMusicCategory.value];
        if (!cfg || !cfg.tracks || cfg.tracks.length === 0) {
          if (currentHeartRate.value != null) {
            const cat = getCategoryByHeartRate(currentHeartRate.value);
            if (cat && cat !== "none") {
              await switchMusicCategory(cat);
              return;
            }
          }
          return;
        }
        if (!canControlTrack.value) {
          await playTrackByIndex(currentMusicCategory.value, 0);
          return;
        }
        if (isPlaying.value) {
          audioCtx.pause();
        } else {
          audioCtx.play();
        }
      };
      const playNextTrack = async () => {
        const cfg = musicLibrary[currentMusicCategory.value];
        if (!cfg || !cfg.tracks || cfg.tracks.length === 0)
          return;
        const nextIndex = cfg.currentIndex >= 0 ? cfg.currentIndex + 1 : 0;
        await playTrackByIndex(currentMusicCategory.value, nextIndex);
      };
      const playPrevTrack = async () => {
        const cfg = musicLibrary[currentMusicCategory.value];
        if (!cfg || !cfg.tracks || cfg.tracks.length === 0)
          return;
        const prevIndex = cfg.currentIndex >= 0 ? cfg.currentIndex - 1 : cfg.tracks.length - 1;
        await playTrackByIndex(currentMusicCategory.value, prevIndex);
      };
      const __returned__ = { isConnected, scanning, batteryLevel, connectedDeviceName, inputMessage, discoveredDevices, get scanStopTimer() {
        return scanStopTimer;
      }, set scanStopTimer(v) {
        scanStopTimer = v;
      }, dataList, sensorData, HR_TOLERANCE, CATEGORY_SWITCH_DELAY, currentHeartRate, currentMusicCategory, manualOverride, manualCategory, isPlaying, currentTrackName, get lastHeartRate() {
        return lastHeartRate;
      }, set lastHeartRate(v) {
        lastHeartRate = v;
      }, get pendingCategory() {
        return pendingCategory;
      }, set pendingCategory(v) {
        pendingCategory = v;
      }, get pendingStartTime() {
        return pendingStartTime;
      }, set pendingStartTime(v) {
        pendingStartTime = v;
      }, hrThresholds, musicLibrary, get audioCtx() {
        return audioCtx;
      }, set audioCtx(v) {
        audioCtx = v;
      }, musicCategoryOptions, thresholdDisplayList, currentMusicCategoryLabel, manualCategoryLabel, canControlTrack, canStartPlay, quickCommands, get bluetoothDevice() {
        return bluetoothDevice;
      }, set bluetoothDevice(v) {
        bluetoothDevice = v;
      }, get writeServiceId() {
        return writeServiceId;
      }, set writeServiceId(v) {
        writeServiceId = v;
      }, get writeCharId() {
        return writeCharId;
      }, set writeCharId(v) {
        writeCharId = v;
      }, get notifyServiceId() {
        return notifyServiceId;
      }, set notifyServiceId(v) {
        notifyServiceId = v;
      }, get notifyCharId() {
        return notifyCharId;
      }, set notifyCharId(v) {
        notifyCharId = v;
      }, initBluetooth, scanDevices, connectToDevice, disconnect, sendData, sendQuickCommand, handleReceivedData, addLog, startBatteryMonitoring, str2ab, ab2str, delay, onHeartRateUpdate, getCategoryByHeartRate, ensureAudioContext, loadCategoryTracks, switchMusicCategory, playTrackByIndex, toggleManualOverride, onManualCategoryChange, togglePlayPause, playNextTrack, playPrevTrack, ref: vue.ref, reactive: vue.reactive, onMounted: vue.onMounted, onUnmounted: vue.onUnmounted, computed: vue.computed };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "watch-container" }, [
      vue.createElementVNode("view", { class: "top-section" }, [
        vue.createElementVNode("view", { class: "status-bar" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["bluetooth-status", { connected: $setup.isConnected }])
            },
            [
              vue.createElementVNode(
                "text",
                { class: "status-icon" },
                vue.toDisplayString($setup.isConnected ? "🔵" : "⚪"),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "status-text" },
                vue.toDisplayString($setup.isConnected ? "已连接" : "未连接"),
                1
                /* TEXT */
              ),
              $setup.isConnected ? (vue.openBlock(), vue.createElementBlock(
                "text",
                {
                  key: 0,
                  class: "device-name"
                },
                vue.toDisplayString($setup.connectedDeviceName),
                1
                /* TEXT */
              )) : vue.createCommentVNode("v-if", true)
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode("view", { class: "battery-indicator" }, [
            vue.createElementVNode("text", { class: "battery-icon" }, "🔋"),
            vue.createElementVNode(
              "text",
              { class: "battery-level" },
              vue.toDisplayString($setup.batteryLevel) + "%",
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "action-buttons" }, [
          vue.createElementVNode("button", {
            class: "btn btn-primary",
            onClick: $setup.scanDevices,
            disabled: $setup.scanning
          }, vue.toDisplayString($setup.scanning ? "扫描中..." : "扫描设备"), 9, ["disabled"]),
          vue.createElementVNode("button", {
            class: "btn btn-secondary",
            onClick: $setup.disconnect,
            disabled: !$setup.isConnected
          }, " 断开连接 ", 8, ["disabled"])
        ])
      ]),
      vue.createElementVNode("view", { class: "middle-section" }, [
        vue.createElementVNode("view", { class: "data-display" }, [
          vue.createElementVNode("view", { class: "data-header" }, [
            vue.createElementVNode("text", { class: "section-title" }, "数据通信"),
            vue.createElementVNode(
              "text",
              { class: "data-count" },
              "共 " + vue.toDisplayString($setup.dataList.length) + " 条记录",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("scroll-view", {
            class: "data-list",
            "scroll-y": "true"
          }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.dataList, (item, index) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: index,
                    class: vue.normalizeClass(["data-item", item.type])
                  },
                  [
                    vue.createElementVNode("view", { class: "data-meta" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "data-time" },
                        vue.toDisplayString(item.time),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "data-type" },
                        vue.toDisplayString(item.type === "received" ? "接收" : "发送"),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "data-content" },
                      vue.toDisplayString(item.content),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        $setup.isConnected ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "sensor-data"
        }, [
          vue.createElementVNode("view", { class: "sensor-grid" }, [
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "心率"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.heartRate || "--") + " BPM",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "血氧"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.spo2 || "--") + " %",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "步数"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.steps || "--"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "温度"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.temperature || "--") + " °C",
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "music-panel" }, [
            vue.createElementVNode("view", { class: "music-row" }, [
              vue.createElementVNode("view", { class: "music-status" }, [
                vue.createElementVNode("text", { class: "music-label" }, "当前节奏"),
                vue.createElementVNode("text", { class: "music-value" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.currentMusicCategoryLabel) + " ",
                    1
                    /* TEXT */
                  ),
                  $setup.currentHeartRate ? (vue.openBlock(), vue.createElementBlock(
                    "text",
                    { key: 0 },
                    "（HR " + vue.toDisplayString($setup.currentHeartRate) + "）",
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ])
              ]),
              vue.createElementVNode("view", { class: "music-status" }, [
                vue.createElementVNode("text", { class: "music-label" }, "自动适配"),
                vue.createElementVNode("switch", {
                  checked: !$setup.manualOverride,
                  onChange: $setup.toggleManualOverride
                }, null, 40, ["checked"])
              ])
            ]),
            vue.createElementVNode("view", { class: "music-row" }, [
              vue.createElementVNode("view", { class: "music-status" }, [
                vue.createElementVNode("text", { class: "music-label" }, "当前曲目"),
                vue.createElementVNode(
                  "text",
                  { class: "music-value" },
                  vue.toDisplayString($setup.currentTrackName || "未选择"),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "music-controls" }, [
                vue.createElementVNode("button", {
                  class: "music-btn",
                  onClick: $setup.playPrevTrack,
                  disabled: !$setup.canControlTrack
                }, "«", 8, ["disabled"]),
                vue.createElementVNode("button", {
                  class: "music-btn main",
                  onClick: $setup.togglePlayPause,
                  disabled: !$setup.canControlTrack && !$setup.canStartPlay
                }, vue.toDisplayString($setup.isPlaying ? "暂停" : "播放"), 9, ["disabled"]),
                vue.createElementVNode("button", {
                  class: "music-btn",
                  onClick: $setup.playNextTrack,
                  disabled: !$setup.canControlTrack
                }, "»", 8, ["disabled"])
              ])
            ]),
            vue.createElementVNode("view", { class: "music-row thresholds-row" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.thresholdDisplayList, (item) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    class: "threshold-item",
                    key: item.key
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "music-label" },
                      vue.toDisplayString(item.label),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "music-value" },
                      vue.toDisplayString(item.rangeText),
                      1
                      /* TEXT */
                    )
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("view", { class: "music-row manual-row" }, [
              vue.createElementVNode("text", { class: "music-label" }, "手动节奏"),
              vue.createElementVNode(
                "picker",
                {
                  mode: "selector",
                  range: $setup.musicCategoryOptions,
                  "range-key": "label",
                  onChange: $setup.onManualCategoryChange
                },
                [
                  vue.createElementVNode("view", { class: "manual-picker" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "music-value" },
                      vue.toDisplayString($setup.manualCategoryLabel),
                      1
                      /* TEXT */
                    )
                  ])
                ],
                32
                /* NEED_HYDRATION */
              )
            ])
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("view", { class: "bottom-section" }, [
        vue.createElementVNode("view", { class: "input-container" }, [
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "input-field",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.inputMessage = $event),
              placeholder: "输入要发送的数据...",
              "placeholder-class": "input-placeholder",
              onConfirm: $setup.sendData
            },
            null,
            544
            /* NEED_HYDRATION, NEED_PATCH */
          ), [
            [vue.vModelText, $setup.inputMessage]
          ]),
          vue.createElementVNode("button", {
            class: "send-btn",
            onClick: $setup.sendData,
            disabled: !$setup.isConnected || !$setup.inputMessage
          }, " 发送 ", 8, ["disabled"])
        ]),
        vue.createElementVNode("view", { class: "quick-commands" }, [
          vue.createElementVNode("text", { class: "commands-title" }, "快捷指令"),
          vue.createElementVNode("view", { class: "command-buttons" }, [
            (vue.openBlock(), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.quickCommands, (cmd) => {
                return vue.createElementVNode("button", {
                  key: cmd.name,
                  class: "cmd-btn",
                  onClick: ($event) => $setup.sendQuickCommand(cmd)
                }, vue.toDisplayString(cmd.name), 9, ["onClick"]);
              }),
              64
              /* STABLE_FRAGMENT */
            ))
          ])
        ])
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/index/index.vue"]]);
  __definePage("pages/index/index", PagesIndexIndex);
  const _sfc_main = {
    __name: "App",
    setup(__props, { expose: __expose }) {
      __expose();
      onLaunch(() => {
        formatAppLog("log", "at App.vue:5", "App Launch");
      });
      onShow(() => {
        formatAppLog("log", "at App.vue:9", "App Show");
      });
      onHide(() => {
        formatAppLog("log", "at App.vue:13", "App Hide");
      });
      const __returned__ = { get onLaunch() {
        return onLaunch;
      }, get onShow() {
        return onShow;
      }, get onHide() {
        return onHide;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
