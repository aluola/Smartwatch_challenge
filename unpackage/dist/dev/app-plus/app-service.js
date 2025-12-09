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
  const STORAGE_KEY = "user_profile_data";
  const QUESTIONNAIRE_COMPLETED_KEY = "questionnaire_completed";
  function getUserProfile() {
    try {
      const data = uni.getStorageSync(STORAGE_KEY);
      return data || null;
    } catch (error) {
      formatAppLog("error", "at utils/userData.js:16", "获取用户资料失败:", error);
      return null;
    }
  }
  function saveUserProfile(profile) {
    try {
      uni.setStorageSync(STORAGE_KEY, profile);
      return true;
    } catch (error) {
      formatAppLog("error", "at utils/userData.js:29", "保存用户资料失败:", error);
      return false;
    }
  }
  function updateUserProfile(updates) {
    try {
      const current = getUserProfile() || {};
      const updated = { ...current, ...updates };
      return saveUserProfile(updated);
    } catch (error) {
      formatAppLog("error", "at utils/userData.js:43", "更新用户资料失败:", error);
      return false;
    }
  }
  function isQuestionnaireCompleted() {
    try {
      const completed = uni.getStorageSync(QUESTIONNAIRE_COMPLETED_KEY);
      return completed === true;
    } catch (error) {
      formatAppLog("error", "at utils/userData.js:56", "检查问卷状态失败:", error);
      return false;
    }
  }
  function markQuestionnaireCompleted() {
    try {
      uni.setStorageSync(QUESTIONNAIRE_COMPLETED_KEY, true);
      return true;
    } catch (error) {
      formatAppLog("error", "at utils/userData.js:69", "标记问卷完成失败:", error);
      return false;
    }
  }
  function calculateBMI(height, weight) {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return null;
    }
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return parseFloat(bmi.toFixed(2));
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$8 = {
    __name: "welcome",
    setup(__props, { expose: __expose }) {
      __expose();
      const checking = vue.ref(true);
      vue.onMounted(() => {
        checkQuestionnaireStatus();
      });
      const checkQuestionnaireStatus = () => {
        setTimeout(() => {
          const completed = isQuestionnaireCompleted();
          if (completed) {
            uni.reLaunch({
              url: "/pages/index/index"
            });
          } else {
            uni.redirectTo({
              url: "/pages/questionnaire/age/age"
            });
          }
        }, 1500);
      };
      const __returned__ = { checking, checkQuestionnaireStatus, ref: vue.ref, onMounted: vue.onMounted, get isQuestionnaireCompleted() {
        return isQuestionnaireCompleted;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "welcome-container" }, [
      vue.createElementVNode("view", { class: "welcome-content" }, [
        vue.createElementVNode("view", { class: "logo-section" }, [
          vue.createElementVNode("text", { class: "logo-icon" }, "🎵"),
          vue.createElementVNode("text", { class: "app-name" }, "智音随行"),
          vue.createElementVNode("text", { class: "app-slogan" }, "让音乐随心率而动")
        ]),
        $setup.checking ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading-section"
        }, [
          vue.createElementVNode("view", { class: "loading-spinner" }),
          vue.createElementVNode("text", { class: "loading-text" }, "正在加载...")
        ])) : vue.createCommentVNode("v-if", true)
      ])
    ]);
  }
  const PagesWelcomeWelcome = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-085f0530"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/welcome/welcome.vue"]]);
  const progress$5 = 16.67;
  const _sfc_main$7 = {
    __name: "age",
    setup(__props, { expose: __expose }) {
      __expose();
      const age = vue.ref("");
      const canNext = vue.computed(() => {
        const ageNum = parseInt(age.value);
        return ageNum && ageNum >= 1 && ageNum <= 120;
      });
      const onAgeInput = (e) => {
        age.value = e.detail.value;
      };
      const handleNext = () => {
        if (!canNext.value) {
          uni.showToast({
            title: "请输入有效的年龄（1-120岁）",
            icon: "none"
          });
          return;
        }
        updateUserProfile({
          age: parseInt(age.value)
        });
        uni.redirectTo({
          url: "/pages/questionnaire/gender/gender"
        });
      };
      const __returned__ = { age, progress: progress$5, canNext, onAgeInput, handleNext, ref: vue.ref, computed: vue.computed, get updateUserProfile() {
        return updateUserProfile;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "1 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "请输入您的年龄"),
          vue.createElementVNode("text", { class: "question-hint" }, "我们将根据您的年龄为您推荐合适的运动强度")
        ]),
        vue.createElementVNode("view", { class: "input-section" }, [
          vue.createElementVNode("view", { class: "input-wrapper" }, [
            vue.withDirectives(vue.createElementVNode(
              "input",
              {
                class: "age-input",
                type: "number",
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.age = $event),
                placeholder: "请输入年龄",
                "placeholder-class": "input-placeholder",
                onInput: $setup.onAgeInput,
                maxlength: "3"
              },
              null,
              544
              /* NEED_HYDRATION, NEED_PATCH */
            ), [
              [vue.vModelText, $setup.age]
            ]),
            vue.createElementVNode("text", { class: "input-unit" }, "岁")
          ]),
          $setup.age ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "input-hint"
          }, [
            vue.createElementVNode(
              "text",
              null,
              "您今年 " + vue.toDisplayString($setup.age) + " 岁",
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.canNext }]),
            onClick: $setup.handleNext,
            disabled: !$setup.canNext
          }, " 下一步 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireAgeAge = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-4c8f67f5"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/age/age.vue"]]);
  const progress$4 = 33.33;
  const _sfc_main$6 = {
    __name: "gender",
    setup(__props, { expose: __expose }) {
      __expose();
      const selectedGender = vue.ref("");
      const selectGender = (gender) => {
        selectedGender.value = gender;
      };
      const handleNext = () => {
        if (!selectedGender.value) {
          uni.showToast({
            title: "请选择性别",
            icon: "none"
          });
          return;
        }
        updateUserProfile({
          gender: selectedGender.value
        });
        uni.redirectTo({
          url: "/pages/questionnaire/body/body"
        });
      };
      const __returned__ = { selectedGender, progress: progress$4, selectGender, handleNext, ref: vue.ref, get updateUserProfile() {
        return updateUserProfile;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "2 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "请选择您的性别"),
          vue.createElementVNode("text", { class: "question-hint" }, "这将帮助我们更好地为您定制运动建议")
        ]),
        vue.createElementVNode("view", { class: "options-section" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["option-card", { selected: $setup.selectedGender === "male" }]),
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.selectGender("male"))
            },
            [
              vue.createElementVNode("text", { class: "option-icon" }, "👨"),
              vue.createElementVNode("text", { class: "option-text" }, "男"),
              $setup.selectedGender === "male" ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "check-mark"
              }, "✓")) : vue.createCommentVNode("v-if", true)
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["option-card", { selected: $setup.selectedGender === "female" }]),
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.selectGender("female"))
            },
            [
              vue.createElementVNode("text", { class: "option-icon" }, "👩"),
              vue.createElementVNode("text", { class: "option-text" }, "女"),
              $setup.selectedGender === "female" ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "check-mark"
              }, "✓")) : vue.createCommentVNode("v-if", true)
            ],
            2
            /* CLASS */
          )
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.selectedGender }]),
            onClick: $setup.handleNext,
            disabled: !$setup.selectedGender
          }, " 下一步 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireGenderGender = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-8fb8ce12"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/gender/gender.vue"]]);
  const progress$3 = 50;
  const _sfc_main$5 = {
    __name: "body",
    setup(__props, { expose: __expose }) {
      __expose();
      const height = vue.ref("");
      const weight = vue.ref("");
      const bmi = vue.computed(() => {
        const h = parseFloat(height.value);
        const w = parseFloat(weight.value);
        if (h && w && h > 0 && w > 0) {
          return calculateBMI(h, w);
        }
        return null;
      });
      const bmiStatus = vue.computed(() => {
        if (!bmi.value)
          return "";
        if (bmi.value < 18.5) {
          return "偏瘦";
        } else if (bmi.value < 24) {
          return "正常";
        } else if (bmi.value < 28) {
          return "偏胖";
        } else {
          return "肥胖";
        }
      });
      const canNext = vue.computed(() => {
        const h = parseFloat(height.value);
        const w = parseFloat(weight.value);
        return h && w && h >= 100 && h <= 250 && w >= 20 && w <= 200;
      });
      const onHeightInput = (e) => {
        height.value = e.detail.value;
      };
      const onWeightInput = (e) => {
        weight.value = e.detail.value;
      };
      const handleNext = () => {
        if (!canNext.value) {
          uni.showToast({
            title: "请输入有效的身高和体重",
            icon: "none"
          });
          return;
        }
        const bmiValue = calculateBMI(parseFloat(height.value), parseFloat(weight.value));
        updateUserProfile({
          height: parseFloat(height.value),
          weight: parseFloat(weight.value),
          bmi: bmiValue
        });
        uni.redirectTo({
          url: "/pages/questionnaire/exercise-freq/exercise-freq"
        });
      };
      const __returned__ = { height, weight, progress: progress$3, bmi, bmiStatus, canNext, onHeightInput, onWeightInput, handleNext, ref: vue.ref, computed: vue.computed, get updateUserProfile() {
        return updateUserProfile;
      }, get calculateBMI() {
        return calculateBMI;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "3 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "请输入您的身高和体重"),
          vue.createElementVNode("text", { class: "question-hint" }, "用于计算BMI指数，为您推荐更合适的运动强度")
        ]),
        vue.createElementVNode("view", { class: "input-section" }, [
          vue.createElementVNode("view", { class: "input-group" }, [
            vue.createElementVNode("view", { class: "input-wrapper" }, [
              vue.createElementVNode("text", { class: "input-label" }, "身高"),
              vue.createElementVNode("view", { class: "input-box" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "body-input",
                    type: "digit",
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.height = $event),
                    placeholder: "请输入身高",
                    "placeholder-class": "input-placeholder",
                    onInput: $setup.onHeightInput,
                    maxlength: "3"
                  },
                  null,
                  544
                  /* NEED_HYDRATION, NEED_PATCH */
                ), [
                  [vue.vModelText, $setup.height]
                ]),
                vue.createElementVNode("text", { class: "input-unit" }, "cm")
              ])
            ]),
            vue.createElementVNode("view", { class: "input-wrapper" }, [
              vue.createElementVNode("text", { class: "input-label" }, "体重"),
              vue.createElementVNode("view", { class: "input-box" }, [
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    class: "body-input",
                    type: "digit",
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.weight = $event),
                    placeholder: "请输入体重",
                    "placeholder-class": "input-placeholder",
                    onInput: $setup.onWeightInput,
                    maxlength: "3"
                  },
                  null,
                  544
                  /* NEED_HYDRATION, NEED_PATCH */
                ), [
                  [vue.vModelText, $setup.weight]
                ]),
                vue.createElementVNode("text", { class: "input-unit" }, "kg")
              ])
            ])
          ]),
          $setup.bmi ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "bmi-display"
          }, [
            vue.createElementVNode("text", { class: "bmi-label" }, "您的BMI指数"),
            vue.createElementVNode(
              "text",
              { class: "bmi-value" },
              vue.toDisplayString($setup.bmi),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "bmi-status" },
              vue.toDisplayString($setup.bmiStatus),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.canNext }]),
            onClick: $setup.handleNext,
            disabled: !$setup.canNext
          }, " 下一步 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireBodyBody = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-229eb5e6"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/body/body.vue"]]);
  const progress$2 = 66.67;
  const _sfc_main$4 = {
    __name: "exercise-freq",
    setup(__props, { expose: __expose }) {
      __expose();
      const selectedFreq = vue.ref("");
      const options = [
        { value: "almost-none", label: "几乎不运动", icon: "🛋️" },
        { value: "occasional", label: "偶尔运动", icon: "🚶" },
        { value: "regular", label: "规律健身", icon: "🏃" },
        { value: "professional", label: "专业训练", icon: "💪" }
      ];
      const selectFreq = (value) => {
        selectedFreq.value = value;
      };
      const handleNext = () => {
        if (!selectedFreq.value) {
          uni.showToast({
            title: "请选择运动频率",
            icon: "none"
          });
          return;
        }
        updateUserProfile({
          exerciseFrequency: selectedFreq.value
        });
        uni.redirectTo({
          url: "/pages/questionnaire/exercise-type/exercise-type"
        });
      };
      const __returned__ = { selectedFreq, progress: progress$2, options, selectFreq, handleNext, ref: vue.ref, get updateUserProfile() {
        return updateUserProfile;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "4 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "您的运动频率如何？"),
          vue.createElementVNode("text", { class: "question-hint" }, "选择最符合您实际情况的选项")
        ]),
        vue.createElementVNode("view", { class: "options-section" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.options, (option, index) => {
              return vue.createElementVNode("view", {
                class: vue.normalizeClass(["option-card", { selected: $setup.selectedFreq === option.value }]),
                key: index,
                onClick: ($event) => $setup.selectFreq(option.value)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "option-icon" },
                  vue.toDisplayString(option.icon),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "option-text" },
                  vue.toDisplayString(option.label),
                  1
                  /* TEXT */
                ),
                $setup.selectedFreq === option.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "check-mark"
                }, "✓")) : vue.createCommentVNode("v-if", true)
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.selectedFreq }]),
            onClick: $setup.handleNext,
            disabled: !$setup.selectedFreq
          }, " 下一步 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireExerciseFreqExerciseFreq = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-f195b24a"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/exercise-freq/exercise-freq.vue"]]);
  const progress$1 = 83.33;
  const _sfc_main$3 = {
    __name: "exercise-type",
    setup(__props, { expose: __expose }) {
      __expose();
      const selectedType = vue.ref("");
      const options = [
        { value: "running", label: "跑步", icon: "🏃" },
        { value: "cycling", label: "骑行", icon: "🚴" },
        { value: "strength", label: "力量训练/撸铁", icon: "🏋️" },
        { value: "hiit", label: "HIIT", icon: "⚡" },
        { value: "yoga", label: "瑜伽/拉伸", icon: "🧘" }
      ];
      const selectType = (value) => {
        selectedType.value = value;
      };
      const handleNext = () => {
        if (!selectedType.value) {
          uni.showToast({
            title: "请选择主要运动类型",
            icon: "none"
          });
          return;
        }
        updateUserProfile({
          exerciseType: selectedType.value
        });
        uni.redirectTo({
          url: "/pages/questionnaire/music-genre/music-genre"
        });
      };
      const __returned__ = { selectedType, progress: progress$1, options, selectType, handleNext, ref: vue.ref, get updateUserProfile() {
        return updateUserProfile;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "5 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "您的主要运动类型是？"),
          vue.createElementVNode("text", { class: "question-hint" }, "选择您最常进行的运动方式")
        ]),
        vue.createElementVNode("view", { class: "options-section" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.options, (option, index) => {
              return vue.createElementVNode("view", {
                class: vue.normalizeClass(["option-card", { selected: $setup.selectedType === option.value }]),
                key: index,
                onClick: ($event) => $setup.selectType(option.value)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "option-icon" },
                  vue.toDisplayString(option.icon),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "option-text" },
                  vue.toDisplayString(option.label),
                  1
                  /* TEXT */
                ),
                $setup.selectedType === option.value ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "check-mark"
                }, "✓")) : vue.createCommentVNode("v-if", true)
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.selectedType }]),
            onClick: $setup.handleNext,
            disabled: !$setup.selectedType
          }, " 下一步 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireExerciseTypeExerciseType = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-6aeda2c9"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/exercise-type/exercise-type.vue"]]);
  const SERVER_IP = "39.107.190.29";
  const SERVER_URL = `http://${SERVER_IP}/calculate`;
  async function sendWithAck(flag, data) {
    const ackResponse = await new Promise((resolve, reject) => {
      uni.request({
        url: SERVER_URL,
        method: "POST",
        data: { flag },
        header: {
          "Content-Type": "application/json"
        },
        timeout: 5e3,
        success: (res) => {
          formatAppLog("log", "at utils/serverApi.js:26", "标志位发送成功，服务器响应:", res);
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`服务器错误: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          formatAppLog("error", "at utils/serverApi.js:34", "发送标志位失败:", err);
          reject(err);
        }
      });
    });
    if (ackResponse !== "yes") {
      throw new Error("服务器未准备好接收数据，响应为: " + ackResponse);
    }
    const formattedData = {};
    for (const [key, value] of Object.entries(data)) {
      formattedData[key] = `${key}：${value}`;
    }
    const dataResponse = await new Promise((resolve, reject) => {
      uni.request({
        url: SERVER_URL,
        method: "POST",
        data: formattedData,
        header: {
          "Content-Type": "application/json"
        },
        timeout: 5e3,
        success: (res) => {
          formatAppLog("log", "at utils/serverApi.js:61", "数据发送成功，服务器响应:", res);
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`服务器错误: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          formatAppLog("error", "at utils/serverApi.js:69", "发送数据失败:", err);
          reject(err);
        }
      });
    });
    return dataResponse;
  }
  async function uploadInitialInfo(initialData) {
    return await sendWithAck(0, initialData);
  }
  async function uploadStatusInfo(statusData) {
    return await sendWithAck(1, statusData);
  }
  function formatDataForLog(data) {
    const lines = [];
    for (const [key, value] of Object.entries(data)) {
      lines.push(`${key}：${value}`);
    }
    return lines.join("\n");
  }
  const progress = 100;
  const _sfc_main$2 = {
    __name: "music-genre",
    setup(__props, { expose: __expose }) {
      __expose();
      const selectedGenres = vue.ref([]);
      const options = [
        { value: "pop", label: "流行", en: "Pop", icon: "🎵" },
        { value: "edm", label: "电子舞曲", en: "EDM", icon: "🎧" },
        { value: "hiphop", label: "嘻哈", en: "Hip-Hop", icon: "🎤" },
        { value: "rock", label: "摇滚", en: "Rock", icon: "🎸" },
        { value: "classical", label: "古典", en: "Classical", icon: "🎹" }
      ];
      const canNext = vue.computed(() => {
        return selectedGenres.value.length > 0;
      });
      const toggleGenre = (value) => {
        const index = selectedGenres.value.indexOf(value);
        if (index > -1) {
          selectedGenres.value.splice(index, 1);
        } else {
          selectedGenres.value.push(value);
        }
      };
      const handleComplete = async () => {
        if (!canNext.value) {
          uni.showToast({
            title: "请至少选择一个音乐流派",
            icon: "none"
          });
          return;
        }
        updateUserProfile({
          musicGenres: selectedGenres.value
        });
        const userProfile = getUserProfile();
        formatAppLog("log", "at pages/questionnaire/music-genre/music-genre.vue:90", "========== 用户问卷信息 ==========");
        formatAppLog("log", "at pages/questionnaire/music-genre/music-genre.vue:91", formatDataForLog(userProfile));
        formatAppLog("log", "at pages/questionnaire/music-genre/music-genre.vue:92", "================================");
        try {
          await uploadInitialInfo(userProfile);
          formatAppLog("log", "at pages/questionnaire/music-genre/music-genre.vue:97", "用户信息上传成功");
        } catch (error) {
          formatAppLog("error", "at pages/questionnaire/music-genre/music-genre.vue:99", "用户信息上传失败:", error);
        }
        markQuestionnaireCompleted();
        uni.showToast({
          title: "问卷完成！",
          icon: "success",
          duration: 1500
        });
        setTimeout(() => {
          uni.reLaunch({
            url: "/pages/index/index"
          });
        }, 1500);
      };
      const __returned__ = { selectedGenres, progress, options, canNext, toggleGenre, handleComplete, ref: vue.ref, computed: vue.computed, get updateUserProfile() {
        return updateUserProfile;
      }, get markQuestionnaireCompleted() {
        return markQuestionnaireCompleted;
      }, get getUserProfile() {
        return getUserProfile;
      }, get uploadInitialInfo() {
        return uploadInitialInfo;
      }, get formatDataForLog() {
        return formatDataForLog;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "questionnaire-container" }, [
      vue.createElementVNode("view", { class: "progress-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "progress-fill",
            style: vue.normalizeStyle({ width: $setup.progress + "%" })
          },
          null,
          4
          /* STYLE */
        )
      ]),
      vue.createElementVNode("view", { class: "content-wrapper" }, [
        vue.createElementVNode("view", { class: "question-header" }, [
          vue.createElementVNode("text", { class: "question-number" }, "6 / 6"),
          vue.createElementVNode("text", { class: "question-title" }, "您喜欢的音乐流派？"),
          vue.createElementVNode("text", { class: "question-hint" }, "可选择多个选项，帮助我们更好地为您推荐音乐")
        ]),
        vue.createElementVNode("view", { class: "options-section" }, [
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.options, (option, index) => {
              return vue.createElementVNode("view", {
                class: vue.normalizeClass(["option-card", { selected: $setup.selectedGenres.includes(option.value) }]),
                key: index,
                onClick: ($event) => $setup.toggleGenre(option.value)
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "option-icon" },
                  vue.toDisplayString(option.icon),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "option-text" },
                  vue.toDisplayString(option.label),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "option-en" },
                  vue.toDisplayString(option.en),
                  1
                  /* TEXT */
                ),
                $setup.selectedGenres.includes(option.value) ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "check-mark"
                }, "✓")) : vue.createCommentVNode("v-if", true)
              ], 10, ["onClick"]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "button-section" }, [
          vue.createElementVNode("button", {
            class: vue.normalizeClass(["next-button", { active: $setup.canNext }]),
            onClick: $setup.handleComplete,
            disabled: !$setup.canNext
          }, " 完成 ", 10, ["disabled"])
        ])
      ])
    ]);
  }
  const PagesQuestionnaireMusicGenreMusicGenre = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-819b469d"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/questionnaire/music-genre/music-genre.vue"]]);
  const BLUETOOTH_DEVICE_KEY = "last_connected_bluetooth_device";
  function saveConnectedDevice(device) {
    try {
      const deviceInfo = {
        deviceId: device.deviceId,
        name: device.name || device.localName || "",
        timestamp: Date.now()
      };
      uni.setStorageSync(BLUETOOTH_DEVICE_KEY, deviceInfo);
      return true;
    } catch (error) {
      formatAppLog("error", "at utils/bluetoothStorage.js:20", "保存蓝牙设备信息失败:", error);
      return false;
    }
  }
  function getLastConnectedDevice() {
    try {
      const device = uni.getStorageSync(BLUETOOTH_DEVICE_KEY);
      return device || null;
    } catch (error) {
      formatAppLog("error", "at utils/bluetoothStorage.js:33", "获取蓝牙设备信息失败:", error);
      return null;
    }
  }
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
      const discoveredDevices = vue.ref([]);
      let scanStopTimer = null;
      const dataList = vue.ref([]);
      const sensorData = vue.reactive({
        heartRate: null,
        spo2: null,
        steps: null,
        temperature: null,
        time: null
      });
      const currentHeartRate = vue.ref(null);
      const currentMusicCategory = vue.ref("none");
      const manualOverride = vue.ref(false);
      const manualCategory = vue.ref("slow");
      const isPlaying = vue.ref(false);
      const currentTrackName = vue.ref("");
      const isLiked = vue.ref(false);
      const musicPlayTime = vue.ref(0);
      let musicPlayTimer = null;
      let musicStartTime = null;
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
      const musicDatabase = {
        slow: [
          { file: "slow_song_1.mp3", bpm: 65 }
        ],
        mid: [
          { file: "mid_song_1.mp3", bpm: 80 },
          { file: "mid_song_2.mp3", bpm: 81 },
          { file: "mid_song_3.mp3", bpm: 82 },
          { file: "mid_song_4.mp3", bpm: 83 },
          { file: "mid_song_5.mp3", bpm: 84 },
          { file: "mid_song_6.mp3", bpm: 85 },
          { file: "mid_song_7.mp3", bpm: 86 },
          { file: "mid_song_8.mp3", bpm: 87 },
          { file: "mid_song_9.mp3", bpm: 88 },
          { file: "mid_song_10.mp3", bpm: 89 },
          { file: "mid_song_11.mp3", bpm: 90 },
          { file: "mid_song_12.mp3", bpm: 91 },
          { file: "mid_song_13.mp3", bpm: 92 },
          { file: "mid_song_14.mp3", bpm: 93 },
          { file: "mid_song_15.mp3", bpm: 94 },
          { file: "mid_song_16.mp3", bpm: 95 },
          { file: "mid_song_17.mp3", bpm: 96 },
          { file: "mid_song_18.mp3", bpm: 97 },
          { file: "mid_song_19.mp3", bpm: 98 },
          { file: "mid_song_20.mp3", bpm: 99 },
          { file: "mid_song_21.mp3", bpm: 99 },
          { file: "mid_song_22.mp3", bpm: 90 },
          { file: "mid_song_23.mp3", bpm: 90 },
          { file: "mid_song_24.mp3", bpm: 90 },
          { file: "mid_song_25.mp3", bpm: 90 },
          { file: "mid_song_26.mp3", bpm: 90 },
          { file: "mid_song_27.mp3", bpm: 90 },
          { file: "mid_song_28.mp3", bpm: 90 },
          { file: "mid_song_29.mp3", bpm: 90 },
          { file: "mid_song_30.mp3", bpm: 90 }
        ],
        midfast: [
          { file: "midfast_song_1.mp3", bpm: 100 },
          { file: "midfast_song_2.mp3", bpm: 101 },
          { file: "midfast_song_3.mp3", bpm: 102 },
          { file: "midfast_song_4.mp3", bpm: 103 },
          { file: "midfast_song_5.mp3", bpm: 104 },
          { file: "midfast_song_6.mp3", bpm: 105 },
          { file: "midfast_song_7.mp3", bpm: 106 },
          { file: "midfast_song_8.mp3", bpm: 107 },
          { file: "midfast_song_9.mp3", bpm: 108 },
          { file: "midfast_song_10.mp3", bpm: 109 },
          { file: "midfast_song_11.mp3", bpm: 110 },
          { file: "midfast_song_12.mp3", bpm: 111 },
          { file: "midfast_song_13.mp3", bpm: 112 },
          { file: "midfast_song_14.mp3", bpm: 113 },
          { file: "midfast_song_15.mp3", bpm: 114 },
          { file: "midfast_song_16.mp3", bpm: 115 },
          { file: "midfast_song_17.mp3", bpm: 116 },
          { file: "midfast_song_18.mp3", bpm: 117 },
          { file: "midfast_song_19.mp3", bpm: 118 },
          { file: "midfast_song_20.mp3", bpm: 119 },
          { file: "midfast_song_21.mp3", bpm: 119 },
          { file: "midfast_song_22.mp3", bpm: 119 },
          { file: "midfast_song_23.mp3", bpm: 119 },
          { file: "midfast_song_24.mp3", bpm: 119 },
          { file: "midfast_song_25.mp3", bpm: 119 },
          { file: "midfast_song_26.mp3", bpm: 119 }
        ],
        fast: [
          { file: "fast_song_1.mp3", bpm: 120 },
          { file: "fast_song_2.mp3", bpm: 121 },
          { file: "fast_song_3.mp3", bpm: 122 },
          { file: "fast_song_4.mp3", bpm: 123 },
          { file: "fast_song_5.mp3", bpm: 124 },
          { file: "fast_song_6.mp3", bpm: 125 },
          { file: "fast_song_7.mp3", bpm: 126 },
          { file: "fast_song_8.mp3", bpm: 127 },
          { file: "fast_song_9.mp3", bpm: 128 },
          { file: "fast_song_10.mp3", bpm: 129 },
          { file: "fast_song_11.mp3", bpm: 130 },
          { file: "fast_song_12.mp3", bpm: 131 },
          { file: "fast_song_13.mp3", bpm: 132 },
          { file: "fast_song_14.mp3", bpm: 133 },
          { file: "fast_song_15.mp3", bpm: 134 },
          { file: "fast_song_16.mp3", bpm: 135 }
        ],
        veryfast: [
          { file: "veryfast_song_1.mp3", bpm: 140 },
          { file: "veryfast_song_2.mp3", bpm: 141 },
          { file: "veryfast_song_3.mp3", bpm: 142 },
          { file: "veryfast_song_4.mp3", bpm: 143 },
          { file: "veryfast_song_5.mp3", bpm: 144 },
          { file: "veryfast_song_6.mp3", bpm: 145 },
          { file: "veryfast_song_7.mp3", bpm: 146 },
          { file: "veryfast_song_8.mp3", bpm: 147 },
          { file: "veryfast_song_9.mp3", bpm: 148 },
          { file: "veryfast_song_10.mp3", bpm: 149 },
          { file: "veryfast_song_11.mp3", bpm: 150 },
          { file: "veryfast_song_12.mp3", bpm: 151 },
          { file: "veryfast_song_13.mp3", bpm: 152 },
          { file: "veryfast_song_14.mp3", bpm: 153 },
          { file: "veryfast_song_15.mp3", bpm: 154 },
          { file: "veryfast_song_16.mp3", bpm: 155 },
          { file: "veryfast_song_17.mp3", bpm: 156 },
          { file: "veryfast_song_18.mp3", bpm: 157 },
          { file: "veryfast_song_19.mp3", bpm: 158 },
          { file: "veryfast_song_20.mp3", bpm: 159 },
          { file: "veryfast_song_21.mp3", bpm: 160 },
          { file: "veryfast_song_22.mp3", bpm: 161 },
          { file: "veryfast_song_23.mp3", bpm: 162 },
          { file: "veryfast_song_24.mp3", bpm: 163 },
          { file: "veryfast_song_25.mp3", bpm: 164 },
          { file: "veryfast_song_26.mp3", bpm: 165 },
          { file: "veryfast_song_27.mp3", bpm: 166 },
          { file: "veryfast_song_28.mp3", bpm: 167 }
        ]
      };
      const musicLibrary = vue.reactive({
        slow: {
          folder: "/static/Music/000-079_BPM_slow/",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        mid: {
          folder: "/static/Music/080-099_BPM_mid/",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        midfast: {
          folder: "/static/Music/100-119_BPM_midfast/",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        fast: {
          folder: "/static/Music/120-139_BPM_fast/",
          tracks: [],
          loaded: false,
          currentIndex: -1
        },
        veryfast: {
          folder: "/static/Music/140+_BPM_veryfast/",
          tracks: [],
          loaded: false,
          currentIndex: -1
        }
      });
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
      let bluetoothDevice = null;
      let writeServiceId = null;
      let writeCharId = null;
      let notifyServiceId = null;
      let notifyCharId = null;
      let receiveBuffer = "";
      vue.onMounted(() => {
        initBluetooth();
        startBatteryMonitoring();
        autoConnectDevice();
      });
      vue.onUnmounted(() => {
        disconnect();
        stopMusicPlayTimer();
      });
      const initBluetooth = async () => {
        try {
          await new Promise((resolve, reject) => {
            uni.openBluetoothAdapter({
              success: resolve,
              fail: reject
            });
          });
          formatAppLog("log", "at pages/index/index.vue:419", "蓝牙适配器初始化成功");
          addLog("系统", "蓝牙适配器已就绪", "system");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:422", "蓝牙初始化失败", error);
          uni.showToast({
            title: "蓝牙初始化失败",
            icon: "none"
          });
        }
      };
      const autoConnectDevice = async () => {
        const lastDevice = getLastConnectedDevice();
        if (!lastDevice || !lastDevice.deviceId) {
          return;
        }
        setTimeout(async () => {
          try {
            await new Promise((resolve, reject) => {
              uni.openBluetoothAdapter({
                success: resolve,
                fail: reject
              });
            });
            scanning.value = true;
            discoveredDevices.value = [];
            await new Promise((resolve, reject) => {
              uni.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: resolve,
                fail: reject
              });
            });
            const foundDeviceHandler = (devices) => {
              const list = devices.devices || [];
              const targetDevice = list.find((d) => d.deviceId === lastDevice.deviceId);
              if (targetDevice) {
                uni.stopBluetoothDevicesDiscovery();
                uni.offBluetoothDeviceFound(foundDeviceHandler);
                scanning.value = false;
                connectToDevice({
                  deviceId: targetDevice.deviceId,
                  name: targetDevice.name || targetDevice.localName || lastDevice.name
                });
              }
            };
            uni.onBluetoothDeviceFound(foundDeviceHandler);
            scanStopTimer = setTimeout(() => {
              uni.stopBluetoothDevicesDiscovery();
              uni.offBluetoothDeviceFound(foundDeviceHandler);
              scanning.value = false;
            }, 6e3);
          } catch (error) {
            formatAppLog("error", "at pages/index/index.vue:486", "自动连接失败", error);
            scanning.value = false;
          }
        }, 1e3);
      };
      const scanDevices = async () => {
        if (scanning.value)
          return;
        scanning.value = true;
        addLog("系统", "开始扫描设备...");
        discoveredDevices.value = [];
        try {
          try {
            await new Promise((resolve, reject) => {
              uni.openBluetoothAdapter({
                success: resolve,
                fail: (err) => {
                  formatAppLog("error", "at pages/index/index.vue:507", "重新打开蓝牙适配器失败", err);
                  resolve();
                }
              });
            });
          } catch (e) {
          }
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
          formatAppLog("error", "at pages/index/index.vue:555", "扫描设备失败", error);
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
          saveConnectedDevice(device);
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
          switchMusicCategory("mid");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:651", "连接设备失败", error);
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
            formatAppLog("error", "at pages/index/index.vue:670", "断开连接失败", error);
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
        uni.showToast({
          title: "已断开",
          icon: "none"
        });
      };
      const handleReceivedData = (data) => {
        if (!data)
          return;
        receiveBuffer += String(data);
        let newlineIndex = receiveBuffer.indexOf("\n");
        while (newlineIndex !== -1) {
          let line = receiveBuffer.substring(0, newlineIndex).trim();
          receiveBuffer = receiveBuffer.substring(newlineIndex + 1);
          if (line) {
            addLog(line, "received");
            parseDeviceLine(line);
          }
          newlineIndex = receiveBuffer.indexOf("\n");
        }
      };
      const parseDeviceLine = (line) => {
        var _a;
        if (line.startsWith("MUSIC:PLAY")) {
          if (!isPlaying.value) {
            formatAppLog("log", "at pages/index/index.vue:727", "收到远程指令: 播放");
            togglePlayPause();
          }
          return;
        }
        if (line.startsWith("MUSIC:PAUSE")) {
          if (isPlaying.value) {
            formatAppLog("log", "at pages/index/index.vue:737", "收到远程指令: 暂停");
            togglePlayPause();
          }
          return;
        }
        if (line.startsWith("MUSIC:NEXT")) {
          formatAppLog("log", "at pages/index/index.vue:745", "收到远程指令: 下一首");
          playNextTrack();
          return;
        }
        if (line.startsWith("MUSIC:PREV")) {
          formatAppLog("log", "at pages/index/index.vue:752", "收到远程指令: 上一首");
          playPrevTrack();
          return;
        }
        if (line.startsWith("HR:")) {
          const hrStr = line.split(":")[1];
          const hr = parseInt(hrStr, 10);
          if (!isNaN(hr)) {
            sensorData.heartRate = hr;
            onHeartRateUpdate(hr);
          }
          return;
        }
        if (/^Heart\s*Rate/i.test(line)) {
          const match = line.match(/(\d+)/);
          if (match) {
            const hr = parseInt(match[1], 10);
            if (!isNaN(hr)) {
              sensorData.heartRate = hr;
              onHeartRateUpdate(hr);
            }
          }
          return;
        }
        if (/TIME:/i.test(line) || /time:/i.test(line)) {
          const timeStr = (_a = line.split(":")[1]) == null ? void 0 : _a.trim();
          if (timeStr) {
            sensorData.time = timeStr;
          }
          return;
        }
        if (/SPO2/i.test(line)) {
          const match = line.match(/(\d+)/);
          if (match) {
            sensorData.spo2 = match[1];
            sensorData.spo2 = sensorData.spo2.replace("%", "");
          }
          return;
        }
        if (/STEPS/i.test(line) || /Step\s+today/i.test(line)) {
          const match = line.match(/(\d+)/);
          if (match) {
            sensorData.steps = match[1];
          }
          return;
        }
        if (/TEMP/i.test(line) || /temperature/i.test(line)) {
          const match = line.match(/(\d+(\.\d+)?)/);
          if (match) {
            sensorData.temperature = match[1];
          }
          return;
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
      const uploadCurrentStatus = async () => {
        const statusData = {
          heartRate: sensorData.heartRate || "--",
          spo2: sensorData.spo2 || "--",
          steps: sensorData.steps || "--",
          temperature: sensorData.temperature || "--",
          currentTrackName: currentTrackName.value || "未选择",
          musicCategory: currentMusicCategoryLabel.value,
          musicPlayTime: musicPlayTime.value,
          isLiked: isLiked.value ? "是" : "否"
        };
        formatAppLog("log", "at pages/index/index.vue:860", "========== 用户状态信息 ==========");
        formatAppLog("log", "at pages/index/index.vue:861", formatDataForLog(statusData));
        formatAppLog("log", "at pages/index/index.vue:862", "================================");
        try {
          await uploadStatusInfo(statusData);
          formatAppLog("log", "at pages/index/index.vue:867", "状态信息上传成功");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:869", "状态信息上传失败:", error);
        }
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
            startMusicPlayTimer();
          });
          audioCtx.onPause(() => {
            isPlaying.value = false;
            stopMusicPlayTimer();
          });
          audioCtx.onStop(() => {
            isPlaying.value = false;
            stopMusicPlayTimer();
            musicPlayTime.value = 0;
          });
          audioCtx.onEnded(() => {
            isPlaying.value = false;
            stopMusicPlayTimer();
            musicPlayTime.value = 0;
          });
          audioCtx.onError((err) => {
            formatAppLog("error", "at pages/index/index.vue:982", "音乐播放错误", err);
            addLog("系统", "音乐播放出错");
            isPlaying.value = false;
            stopMusicPlayTimer();
          });
        }
      };
      const startMusicPlayTimer = () => {
        stopMusicPlayTimer();
        musicStartTime = Date.now();
        musicPlayTimer = setInterval(() => {
          if (musicStartTime) {
            musicPlayTime.value = Math.floor((Date.now() - musicStartTime) / 1e3);
          }
        }, 1e3);
      };
      const stopMusicPlayTimer = () => {
        if (musicPlayTimer) {
          clearInterval(musicPlayTimer);
          musicPlayTimer = null;
        }
        musicStartTime = null;
      };
      const toggleLike = async () => {
        if (!currentTrackName.value)
          return;
        isLiked.value = !isLiked.value;
        await uploadCurrentStatus();
      };
      const uploadStatusInfoOld = async () => {
        const statusData = {
          heartRate: sensorData.heartRate || "--",
          spo2: sensorData.spo2 || "--",
          steps: sensorData.steps || "--",
          temperature: sensorData.temperature || "--",
          currentTrackName: currentTrackName.value || "未选择",
          musicCategory: currentMusicCategoryLabel.value,
          musicPlayTime: musicPlayTime.value,
          isLiked: isLiked.value ? "是" : "否"
        };
        formatAppLog("log", "at pages/index/index.vue:1032", "========== 用户状态信息 ==========");
        formatAppLog("log", "at pages/index/index.vue:1033", formatDataForLog(statusData));
        formatAppLog("log", "at pages/index/index.vue:1034", "================================");
        try {
          await uploadToServer(statusData);
          formatAppLog("log", "at pages/index/index.vue:1039", "状态信息上传成功");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:1041", "状态信息上传失败:", error);
        }
      };
      const loadCategoryTracks = (category) => {
        return new Promise((resolve) => {
          const cfg = musicLibrary[category];
          const tracks = musicDatabase[category] || [];
          if (tracks.length > 0) {
            cfg.tracks = tracks;
            cfg.loaded = true;
            formatAppLog("log", "at pages/index/index.vue:1056", `分类 ${category} 加载了 ${tracks.length} 首歌曲`);
          } else {
            formatAppLog("warn", "at pages/index/index.vue:1058", `分类 ${category} 没有定义歌曲`);
            addLog("系统", `分类 ${category} 暂无歌曲配置`);
          }
          resolve();
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
        let idx = index;
        if (idx < 0)
          idx = total - 1;
        if (idx >= total)
          idx = 0;
        if (currentTrackName.value) {
          await uploadCurrentStatus();
        }
        cfg.currentIndex = idx;
        const track = cfg.tracks[idx];
        ensureAudioContext();
        stopMusicPlayTimer();
        musicPlayTime.value = 0;
        isLiked.value = false;
        const fullPath = cfg.folder + track.file;
        formatAppLog("log", "at pages/index/index.vue:1120", "准备播放:", fullPath);
        audioCtx.src = fullPath;
        audioCtx.play();
        isPlaying.value = true;
        currentMusicCategory.value = category;
        currentTrackName.value = track.file;
        addLog("系统", `切换至 ${category}：${track.file} (${track.bpm} BPM)`);
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
          await switchMusicCategory("mid");
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
      const __returned__ = { isConnected, scanning, batteryLevel, connectedDeviceName, discoveredDevices, get scanStopTimer() {
        return scanStopTimer;
      }, set scanStopTimer(v) {
        scanStopTimer = v;
      }, dataList, sensorData, HR_TOLERANCE, CATEGORY_SWITCH_DELAY, currentHeartRate, currentMusicCategory, manualOverride, manualCategory, isPlaying, currentTrackName, isLiked, musicPlayTime, get musicPlayTimer() {
        return musicPlayTimer;
      }, set musicPlayTimer(v) {
        musicPlayTimer = v;
      }, get musicStartTime() {
        return musicStartTime;
      }, set musicStartTime(v) {
        musicStartTime = v;
      }, get lastHeartRate() {
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
      }, hrThresholds, musicDatabase, musicLibrary, get audioCtx() {
        return audioCtx;
      }, set audioCtx(v) {
        audioCtx = v;
      }, musicCategoryOptions, thresholdDisplayList, currentMusicCategoryLabel, manualCategoryLabel, canControlTrack, canStartPlay, get bluetoothDevice() {
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
      }, get receiveBuffer() {
        return receiveBuffer;
      }, set receiveBuffer(v) {
        receiveBuffer = v;
      }, initBluetooth, autoConnectDevice, scanDevices, connectToDevice, disconnect, handleReceivedData, parseDeviceLine, addLog, startBatteryMonitoring, uploadCurrentStatus, str2ab, ab2str, delay, onHeartRateUpdate, getCategoryByHeartRate, ensureAudioContext, startMusicPlayTimer, stopMusicPlayTimer, toggleLike, uploadStatusInfoOld, loadCategoryTracks, switchMusicCategory, playTrackByIndex, toggleManualOverride, onManualCategoryChange, togglePlayPause, playNextTrack, playPrevTrack, ref: vue.ref, reactive: vue.reactive, onMounted: vue.onMounted, onUnmounted: vue.onUnmounted, computed: vue.computed, get saveConnectedDevice() {
        return saveConnectedDevice;
      }, get getLastConnectedDevice() {
        return getLastConnectedDevice;
      }, get uploadInitialInfo() {
        return uploadInitialInfo;
      }, get uploadStatusInfo() {
        return uploadStatusInfo;
      }, get formatDataForLog() {
        return formatDataForLog;
      } };
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
          class: "watch-time"
        }, [
          vue.createElementVNode("view", { class: "time-header" }, [
            vue.createElementVNode("text", { class: "time-title" }, "手表当前时间")
          ]),
          vue.createElementVNode("view", { class: "time-content" }, [
            vue.createElementVNode(
              "text",
              { class: "time-value" },
              vue.toDisplayString($setup.sensorData.time || "--"),
              1
              /* TEXT */
            )
          ])
        ])) : vue.createCommentVNode("v-if", true),
        $setup.isConnected ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "sensor-data"
        }, [
          vue.createElementVNode("view", { class: "sensor-grid" }, [
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "心率"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.heartRate ?? "--") + " BPM",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "血氧"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.spo2 ?? "--") + " %",
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "步数"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.steps ?? "--"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "温度"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.temperature ?? "--") + " °C",
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
                  class: "like-btn",
                  onClick: $setup.toggleLike,
                  disabled: !$setup.currentTrackName
                }, [
                  vue.createElementVNode(
                    "text",
                    {
                      class: vue.normalizeClass(["like-icon", { liked: $setup.isLiked }])
                    },
                    vue.toDisplayString($setup.isLiked ? "❤️" : "🤍"),
                    3
                    /* TEXT, CLASS */
                  )
                ], 8, ["disabled"]),
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
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/Hbuilder/Project/Smartwatch/智音随行/pages/index/index.vue"]]);
  __definePage("pages/welcome/welcome", PagesWelcomeWelcome);
  __definePage("pages/questionnaire/age/age", PagesQuestionnaireAgeAge);
  __definePage("pages/questionnaire/gender/gender", PagesQuestionnaireGenderGender);
  __definePage("pages/questionnaire/body/body", PagesQuestionnaireBodyBody);
  __definePage("pages/questionnaire/exercise-freq/exercise-freq", PagesQuestionnaireExerciseFreqExerciseFreq);
  __definePage("pages/questionnaire/exercise-type/exercise-type", PagesQuestionnaireExerciseTypeExerciseType);
  __definePage("pages/questionnaire/music-genre/music-genre", PagesQuestionnaireMusicGenreMusicGenre);
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
