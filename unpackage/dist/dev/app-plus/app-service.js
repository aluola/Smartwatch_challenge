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
  const SERVER_IP = "47.93.210.224";
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
    const response = await sendWithAck(1, statusData);
    return response;
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
  const CADENCE_TIME_WINDOW = 5e3;
  const MUSIC_FOLDER = "/static/music_new/music/";
  const DEFAULT_TRACK = "010377.mp3";
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
      const stepHistory = vue.ref([]);
      let cadenceUpdateTimer = null;
      const dataList = vue.ref([]);
      const sensorData = vue.reactive({
        heartRate: null,
        spo2: null,
        stepssteps: null,
        temperature: null,
        time: null,
        cadence: null
        // 步频（步/分钟）
      });
      const isPlaying = vue.ref(false);
      const currentTrackName = vue.ref("");
      const isLiked = vue.ref(false);
      const musicPlayTime = vue.ref(0);
      let musicPlayTimer = null;
      let musicStartTime = null;
      const trackList = vue.ref([]);
      const currentTrackIndex = vue.ref(-1);
      let audioCtx = null;
      let bluetoothDevice = null;
      let writeServiceId = null;
      let writeCharId = null;
      let notifyServiceId = null;
      let notifyCharId = null;
      let receiveBuffer = "";
      vue.onMounted(() => {
        initBluetooth();
        startBatteryMonitoring();
        setTimeout(() => {
          try {
            loadDefaultTrack();
          } catch (error) {
            formatAppLog("error", "at pages/index/index.vue:178", "初始化默认歌曲失败:", error);
          }
        }, 1e3);
      });
      const loadTrackList = async () => {
        try {
          return new Promise((resolve) => {
            const fs = uni.getFileSystemManager();
            const possiblePaths = [
              "_www/static/music_new/music_list.json",
              "static/music_new/music_list.json",
              "/static/music_new/music_list.json"
            ];
            const tryReadFile = (pathIndex) => {
              if (pathIndex >= possiblePaths.length) {
                formatAppLog("error", "at pages/index/index.vue:201", "所有路径都无法读取歌曲列表文件，尝试使用HTTP请求");
                uni.request({
                  url: "http://localhost:8080/static/music_new/music_list.json",
                  method: "GET",
                  success: (res) => {
                    if (res.statusCode === 200 && Array.isArray(res.data)) {
                      trackList.value = res.data.sort();
                      formatAppLog("log", "at pages/index/index.vue:209", `成功通过HTTP加载 ${trackList.value.length} 首歌曲`);
                      resolve(true);
                    } else {
                      formatAppLog("error", "at pages/index/index.vue:212", "HTTP请求返回格式不正确");
                      resolve(false);
                    }
                  },
                  fail: () => {
                    formatAppLog("error", "at pages/index/index.vue:217", "所有方法都无法加载歌曲列表");
                    resolve(false);
                  }
                });
                return;
              }
              const path = possiblePaths[pathIndex];
              fs.readFile({
                filePath: path,
                encoding: "utf8",
                success: (res) => {
                  try {
                    const data = JSON.parse(res.data);
                    if (Array.isArray(data)) {
                      trackList.value = data.sort();
                      formatAppLog("log", "at pages/index/index.vue:233", `成功加载 ${trackList.value.length} 首歌曲 (使用路径: ${path})`);
                      resolve(true);
                    } else {
                      formatAppLog("error", "at pages/index/index.vue:236", "JSON格式不正确");
                      tryReadFile(pathIndex + 1);
                    }
                  } catch (parseErr) {
                    formatAppLog("error", "at pages/index/index.vue:240", "JSON解析失败:", parseErr);
                    tryReadFile(pathIndex + 1);
                  }
                },
                fail: (err) => {
                  formatAppLog("log", "at pages/index/index.vue:245", `路径 ${path} 读取失败，尝试下一个路径:`, err.errMsg || err);
                  tryReadFile(pathIndex + 1);
                }
              });
            };
            tryReadFile(0);
          });
          formatAppLog("warn", "at pages/index/index.vue:282", "未识别的平台，尝试使用uni.request");
          try {
            const res = await new Promise((resolve, reject) => {
              uni.request({
                url: "/static/music_new/music_list.json",
                method: "GET",
                success: resolve,
                fail: reject
              });
            });
            if (res.statusCode === 200 && Array.isArray(res.data)) {
              trackList.value = res.data.sort();
              formatAppLog("log", "at pages/index/index.vue:295", `成功加载 ${trackList.value.length} 首歌曲`);
              return true;
            }
          } catch (error) {
            formatAppLog("error", "at pages/index/index.vue:299", "加载歌曲列表失败:", error);
          }
          return false;
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:303", "加载歌曲列表失败:", error);
          return false;
        }
      };
      const loadDefaultTrack = async () => {
        try {
          const loaded = await loadTrackList();
          if (!loaded && trackList.value.length === 0) {
            trackList.value = [DEFAULT_TRACK];
            formatAppLog("warn", "at pages/index/index.vue:317", "无法加载完整歌曲列表，仅使用默认歌曲");
          }
          if (!audioCtx) {
            ensureAudioContext();
          }
          if (!audioCtx) {
            formatAppLog("warn", "at pages/index/index.vue:324", "音频上下文创建失败，跳过默认歌曲加载");
            return;
          }
          const defaultIndex = trackList.value.indexOf(DEFAULT_TRACK);
          if (defaultIndex >= 0) {
            currentTrackIndex.value = defaultIndex;
          } else {
            trackList.value.push(DEFAULT_TRACK);
            trackList.value.sort();
            currentTrackIndex.value = trackList.value.indexOf(DEFAULT_TRACK);
          }
          const fullPath = MUSIC_FOLDER + DEFAULT_TRACK;
          formatAppLog("log", "at pages/index/index.vue:340", "默认歌曲已加载:", fullPath, "索引:", currentTrackIndex.value, "列表长度:", trackList.value.length);
          audioCtx.src = fullPath;
          currentTrackName.value = DEFAULT_TRACK;
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:345", "加载默认歌曲失败:", error);
          currentTrackName.value = "";
        }
      };
      const canControlTrack = vue.computed(() => {
        return trackList.value.length > 0 && currentTrackIndex.value >= 0;
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
          formatAppLog("log", "at pages/index/index.vue:370", "蓝牙适配器初始化成功");
          addLog("系统", "蓝牙适配器已就绪", "system");
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:373", "蓝牙初始化失败", error);
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
          try {
            await new Promise((resolve, reject) => {
              uni.openBluetoothAdapter({
                success: resolve,
                fail: (err) => {
                  formatAppLog("error", "at pages/index/index.vue:398", "重新打开蓝牙适配器失败", err);
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
          formatAppLog("error", "at pages/index/index.vue:446", "扫描设备失败", error);
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
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:540", "连接设备失败", error);
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
            formatAppLog("error", "at pages/index/index.vue:559", "断开连接失败", error);
          }
        }
        isConnected.value = false;
        connectedDeviceName.value = "";
        bluetoothDevice = null;
        writeServiceId = null;
        writeCharId = null;
        notifyServiceId = null;
        notifyCharId = null;
        stepHistory.value = [];
        sensorData.cadence = null;
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
        if (line.startsWith("MUSIC:PLAY")) {
          if (!isPlaying.value) {
            formatAppLog("log", "at pages/index/index.vue:620", "收到远程指令: 播放");
            togglePlayPause();
          }
          return;
        }
        if (line.startsWith("MUSIC:PAUSE")) {
          if (isPlaying.value) {
            formatAppLog("log", "at pages/index/index.vue:630", "收到远程指令: 暂停");
            togglePlayPause();
          }
          return;
        }
        if (line.startsWith("MUSIC:PREV")) {
          formatAppLog("log", "at pages/index/index.vue:638", "收到远程指令: 上一首");
          playPrevTrack();
          return;
        }
        if (line.startsWith("MUSIC:NEXT")) {
          formatAppLog("log", "at pages/index/index.vue:645", "收到远程指令: 下一首");
          playNextTrack();
          return;
        }
        if (line.trim().toLowerCase().startsWith("heartrate:")) {
          const parts = line.split(":", 2);
          if (parts.length === 2) {
            const hrStr = parts[1].trim();
            const hr = parseInt(hrStr, 10);
            if (!isNaN(hr)) {
              sensorData.heartRate = hr;
            }
          }
          return;
        }
        if (line.trim().toLowerCase().startsWith("time:")) {
          const parts = line.split(":", 2);
          if (parts.length === 2) {
            const timeStr = parts[1].trim();
            if (timeStr) {
              sensorData.time = timeStr;
            }
          }
          return;
        }
        if (line.trim().toUpperCase().startsWith("SPO2:")) {
          const parts = line.split(":", 2);
          if (parts.length === 2) {
            const spo2Str = parts[1].trim().replace("%", "");
            const spo2 = parseInt(spo2Str, 10);
            if (!isNaN(spo2)) {
              sensorData.spo2 = spo2;
            }
          }
          return;
        }
        if (line.trim().toUpperCase().startsWith("STEPSSTEPS:")) {
          const colonCount = (line.match(/:/g) || []).length;
          if (colonCount === 1) {
            const parts = line.split(":", 2);
            if (parts.length === 2) {
              const stepsStr = parts[1].trim();
              const newSteps = parseInt(stepsStr, 10);
              if (!isNaN(newSteps)) {
                sensorData.stepssteps = newSteps;
                updateStepHistory(newSteps);
              }
            }
          }
          return;
        }
        if (line.trim().toLowerCase().startsWith("temperature:")) {
          const parts = line.split(":", 2);
          if (parts.length === 2) {
            const tempStr = parts[1].trim();
            const temp = parseFloat(tempStr);
            if (!isNaN(temp)) {
              sensorData.temperature = temp;
            }
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
      const updateStepHistory = (stepssteps) => {
        const now = Date.now();
        stepHistory.value.push({ timestamp: now, stepssteps });
        const cutoffTime = now - CADENCE_TIME_WINDOW;
        stepHistory.value = stepHistory.value.filter((item) => item.timestamp >= cutoffTime);
        calculateCadence();
      };
      const calculateCadence = () => {
        if (stepHistory.value.length < 2) {
          return;
        }
        const firstRecord = stepHistory.value[0];
        const lastRecord = stepHistory.value[stepHistory.value.length - 1];
        const timeDiff = lastRecord.timestamp - firstRecord.timestamp;
        const stepDiff = lastRecord.stepssteps - firstRecord.stepssteps;
        if (timeDiff <= 0 || stepDiff <= 0) {
          return;
        }
        const cadence = Math.round(stepDiff * 6e4 / timeDiff);
        sensorData.cadence = cadence;
        formatAppLog("log", "at pages/index/index.vue:786", `步频计算：${stepDiff}步 / ${timeDiff / 1e3}秒 = ${cadence}步/分钟`);
      };
      const uploadCurrentStatus = async () => {
        const statusData = {
          heartRate: sensorData.heartRate || "--",
          spo2: sensorData.spo2 || "--",
          steps: sensorData.stepssteps || "--",
          cadence: sensorData.cadence || "--",
          temperature: sensorData.temperature || "--",
          currentTrackName: currentTrackName.value || "未选择",
          musicCategory: "--",
          musicPlayTime: musicPlayTime.value,
          isLiked: isLiked.value ? "是" : "否"
        };
        formatAppLog("log", "at pages/index/index.vue:804", "========== 用户状态信息 ==========");
        formatAppLog("log", "at pages/index/index.vue:805", formatDataForLog(statusData));
        formatAppLog("log", "at pages/index/index.vue:806", "================================");
        try {
          const response = await uploadStatusInfo(statusData);
          formatAppLog("log", "at pages/index/index.vue:811", "状态信息上传成功，服务器响应:", response);
          handleServerRecommendedSong(response);
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:816", "状态信息上传失败:", error);
        }
      };
      const handleServerRecommendedSong = (response) => {
        let recommendedSong = null;
        if (typeof response === "string") {
          const trimmed = response.trim();
          if (/\.mp3$/i.test(trimmed)) {
            recommendedSong = trimmed;
          }
        } else if (typeof response === "object" && response !== null) {
          recommendedSong = response.recommendedSong || response.song || response.trackName || response.file;
          if (recommendedSong && typeof recommendedSong === "string") {
            recommendedSong = recommendedSong.trim();
            if (!/\.mp3$/i.test(recommendedSong)) {
              recommendedSong = null;
            }
          } else {
            recommendedSong = null;
          }
        }
        if (recommendedSong && recommendedSong !== currentTrackName.value) {
          formatAppLog("log", "at pages/index/index.vue:848", "收到服务器推荐的歌曲:", recommendedSong);
          const songIndex = trackList.value.indexOf(recommendedSong);
          if (songIndex >= 0) {
            currentTrackIndex.value = songIndex;
            playTrack(recommendedSong, false);
          } else {
            playTrack(recommendedSong, true);
          }
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
            formatAppLog("error", "at pages/index/index.vue:918", "音乐播放错误", err);
            addLog("系统", "音乐播放出错");
            isPlaying.value = false;
            stopMusicPlayTimer();
          });
        }
      };
      const playTrack = async (trackFileName, updateIndex = true) => {
        if (!trackFileName || typeof trackFileName !== "string") {
          formatAppLog("error", "at pages/index/index.vue:929", "无效的歌曲文件名:", trackFileName);
          return;
        }
        if (currentTrackName.value && currentTrackName.value !== trackFileName) {
          await uploadCurrentStatus();
        }
        ensureAudioContext();
        if (!audioCtx) {
          formatAppLog("error", "at pages/index/index.vue:941", "音频上下文未创建");
          return;
        }
        if (currentTrackName.value !== trackFileName) {
          stopMusicPlayTimer();
          musicPlayTime.value = 0;
          isLiked.value = false;
        }
        if (updateIndex) {
          const existingIndex = trackList.value.indexOf(trackFileName);
          if (existingIndex >= 0) {
            currentTrackIndex.value = existingIndex;
          } else {
            trackList.value.push(trackFileName);
            trackList.value.sort();
            currentTrackIndex.value = trackList.value.indexOf(trackFileName);
            formatAppLog("warn", "at pages/index/index.vue:962", `歌曲 ${trackFileName} 不在列表中，已添加`);
          }
        }
        const fullPath = MUSIC_FOLDER + trackFileName;
        formatAppLog("log", "at pages/index/index.vue:969", "准备播放:", fullPath, "当前索引:", currentTrackIndex.value, "列表长度:", trackList.value.length);
        try {
          const wasPlaying = isPlaying.value;
          if (wasPlaying) {
            audioCtx.pause();
          }
          audioCtx.src = fullPath;
          currentTrackName.value = trackFileName;
          addLog("系统", `播放：${trackFileName}`, "system");
          if (wasPlaying) {
            setTimeout(() => {
              try {
                const playResult = audioCtx.play();
                if (playResult && typeof playResult.catch === "function") {
                  playResult.catch((err) => {
                    formatAppLog("error", "at pages/index/index.vue:992", "播放失败:", err);
                    addLog("系统", `播放失败：${trackFileName}`, "system");
                  });
                }
              } catch (playErr) {
                formatAppLog("error", "at pages/index/index.vue:997", "调用play()失败:", playErr);
                addLog("系统", `播放失败：${trackFileName}`, "system");
              }
            }, 100);
          }
        } catch (error) {
          formatAppLog("error", "at pages/index/index.vue:1004", "设置音频源失败:", error);
          addLog("系统", `播放失败：${trackFileName}`);
          uni.showToast({
            title: "播放失败",
            icon: "none"
          });
        }
      };
      const playPrevTrack = async () => {
        if (trackList.value.length === 0) {
          formatAppLog("warn", "at pages/index/index.vue:1016", "歌曲列表为空，无法切歌");
          return;
        }
        let prevIndex = currentTrackIndex.value - 1;
        if (prevIndex < 0) {
          prevIndex = trackList.value.length - 1;
        }
        currentTrackIndex.value = prevIndex;
        const prevTrack = trackList.value[prevIndex];
        formatAppLog("log", "at pages/index/index.vue:1027", `切歌到上一首: ${prevTrack} (索引: ${prevIndex}/${trackList.value.length - 1})`);
        const wasPlaying = isPlaying.value;
        await playTrack(prevTrack, false);
        if (wasPlaying && audioCtx) {
          setTimeout(() => {
            try {
              const playResult = audioCtx.play();
              if (playResult && typeof playResult.catch === "function") {
                playResult.catch((err) => {
                  formatAppLog("error", "at pages/index/index.vue:1040", "播放上一首失败:", err);
                });
              }
            } catch (playErr) {
              formatAppLog("error", "at pages/index/index.vue:1044", "调用play()失败:", playErr);
            }
          }, 150);
        }
      };
      const playNextTrack = async () => {
        if (trackList.value.length === 0) {
          formatAppLog("warn", "at pages/index/index.vue:1053", "歌曲列表为空，无法切歌");
          return;
        }
        let nextIndex = currentTrackIndex.value + 1;
        if (nextIndex >= trackList.value.length) {
          nextIndex = 0;
        }
        currentTrackIndex.value = nextIndex;
        const nextTrack = trackList.value[nextIndex];
        formatAppLog("log", "at pages/index/index.vue:1064", `切歌到下一首: ${nextTrack} (索引: ${nextIndex}/${trackList.value.length - 1})`);
        const wasPlaying = isPlaying.value;
        await playTrack(nextTrack, false);
        if (wasPlaying && audioCtx) {
          setTimeout(() => {
            try {
              const playResult = audioCtx.play();
              if (playResult && typeof playResult.catch === "function") {
                playResult.catch((err) => {
                  formatAppLog("error", "at pages/index/index.vue:1077", "播放下一首失败:", err);
                });
              }
            } catch (playErr) {
              formatAppLog("error", "at pages/index/index.vue:1081", "调用play()失败:", playErr);
            }
          }, 150);
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
      const togglePlayPause = async () => {
        if (!currentTrackName.value) {
          await playTrack(DEFAULT_TRACK);
          setTimeout(() => {
            if (audioCtx) {
              try {
                const playResult = audioCtx.play();
                if (playResult && typeof playResult.catch === "function") {
                  playResult.catch((err) => {
                    formatAppLog("error", "at pages/index/index.vue:1127", "播放默认歌曲失败:", err);
                  });
                }
              } catch (playErr) {
                formatAppLog("error", "at pages/index/index.vue:1131", "调用play()失败:", playErr);
              }
            }
          }, 150);
          return;
        }
        ensureAudioContext();
        if (!audioCtx) {
          formatAppLog("error", "at pages/index/index.vue:1141", "音频上下文未创建");
          return;
        }
        if (isPlaying.value) {
          audioCtx.pause();
        } else {
          if (!audioCtx.src) {
            const fullPath = MUSIC_FOLDER + currentTrackName.value;
            audioCtx.src = fullPath;
          }
          try {
            const playResult = audioCtx.play();
            if (playResult && typeof playResult.catch === "function") {
              playResult.catch((err) => {
                formatAppLog("error", "at pages/index/index.vue:1157", "播放失败:", err);
                uni.showToast({
                  title: "播放失败",
                  icon: "none"
                });
              });
            }
          } catch (playErr) {
            formatAppLog("error", "at pages/index/index.vue:1165", "调用play()失败:", playErr);
            uni.showToast({
              title: "播放失败",
              icon: "none"
            });
          }
        }
      };
      const __returned__ = { isConnected, scanning, batteryLevel, connectedDeviceName, discoveredDevices, get scanStopTimer() {
        return scanStopTimer;
      }, set scanStopTimer(v) {
        scanStopTimer = v;
      }, stepHistory, CADENCE_TIME_WINDOW, get cadenceUpdateTimer() {
        return cadenceUpdateTimer;
      }, set cadenceUpdateTimer(v) {
        cadenceUpdateTimer = v;
      }, dataList, sensorData, isPlaying, currentTrackName, isLiked, musicPlayTime, get musicPlayTimer() {
        return musicPlayTimer;
      }, set musicPlayTimer(v) {
        musicPlayTimer = v;
      }, get musicStartTime() {
        return musicStartTime;
      }, set musicStartTime(v) {
        musicStartTime = v;
      }, MUSIC_FOLDER, DEFAULT_TRACK, trackList, currentTrackIndex, get audioCtx() {
        return audioCtx;
      }, set audioCtx(v) {
        audioCtx = v;
      }, get bluetoothDevice() {
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
      }, loadTrackList, loadDefaultTrack, canControlTrack, initBluetooth, scanDevices, connectToDevice, disconnect, handleReceivedData, parseDeviceLine, addLog, startBatteryMonitoring, updateStepHistory, calculateCadence, uploadCurrentStatus, handleServerRecommendedSong, str2ab, ab2str, delay, onHeartRateUpdate, ensureAudioContext, playTrack, playPrevTrack, playNextTrack, startMusicPlayTimer, stopMusicPlayTimer, toggleLike, togglePlayPause, ref: vue.ref, reactive: vue.reactive, onMounted: vue.onMounted, onUnmounted: vue.onUnmounted, computed: vue.computed, get saveConnectedDevice() {
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
                vue.toDisplayString($setup.sensorData.stepssteps ?? "--"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "sensor-item" }, [
              vue.createElementVNode("text", { class: "sensor-label" }, "步频"),
              vue.createElementVNode(
                "text",
                { class: "sensor-value" },
                vue.toDisplayString($setup.sensorData.cadence ?? "--") + " 步/分钟",
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
                  disabled: !$setup.currentTrackName
                }, vue.toDisplayString($setup.isPlaying ? "暂停" : "播放"), 9, ["disabled"]),
                vue.createElementVNode("button", {
                  class: "music-btn",
                  onClick: $setup.playNextTrack,
                  disabled: !$setup.canControlTrack
                }, "»", 8, ["disabled"])
              ])
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
