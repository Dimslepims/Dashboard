<template>
  <div ref="widgetContainer" class="widget-container">
    <component
      v-for="(widget, index) in userWidgets"
      :key="widget.id"
      :id="widget.id"
      :is="widget.toLoad"
      :config="widget.config"
      :widgetIdx="index"
      :widgetId="widget.id"
      :ref="'widget-' + widget.id"
      v-on:delete_widget="deleteWidget"
      v-on:edit_config="editConfig"
      v-on:move_widget="moveWidget"
    >
    </component>

    <div>
      <b-button v-b-modal.modal-multi-1 class="addWidget">Add Widget</b-button>
      <b-modal
        id="modal-multi-1"
        size="xl"
        title="Choose a service"
        ok-only
        no-stacking
      >
        <div class="listServices">
          <b-button
            v-b-modal.modal-multi-2
            v-for="value in availableServices"
            :key="value.name"
            @click="chooseService(value.name)"
          >
            {{ value.name }} service
          </b-button>
        </div>
      </b-modal>
      <b-modal
        id="modal-multi-2"
        title="Choose your widget"
        ok-only
        no-stacking
      >
        <div class="listWidgets">
          <b-button
            v-b-modal.modal-prevent-closing
            v-for="value in serviceToAdd"
            :key="value.name"
            @click="chooseWidget(value)"
          >
            {{ value.description }}
          </b-button>
        </div>
      </b-modal>
      <b-modal
        id="modal-prevent-closing"
        :title="dynamicDatas.service + ' : ' + widgetToAdd.name"
        @ok="submitConfig"
        @close="closeModal"
        ok-only
      >
        <div class="listWidgets">
          <h3>Parameters</h3>
          <fieldset class="myFieldSet">
            <label for="refresh_rate">Refresh rate</label>
            <input
              v-model="dynamicDatas.config['refresh_rate']"
              placeholder="refresh rate in seconds"
              id="refresh_rate"
              required
            />
          </fieldset>
          <div v-for="value in widgetToAdd.params" :key="value.name">
            <fieldset class="myFieldSet">
              <label :for="value.name"> {{ value.name }} </label>
              <input
                v-model="dynamicDatas.config[value.name]"
                :placeholder="value.name"
                :id="value.name"
                required
              />
            </fieldset>
          </div>
          <p v-if="formError" style="color: red; text-align: center;">{{ errorDescription }}</p>
        </div>
      </b-modal>
    </div>
  </div>
</template>

<script>
import Axios from "axios";
import RedditUserInfos from "./Widgets/Reddit/UserInformation.vue";
import RedditBrowseUsers from "./Widgets/Reddit/BrowseUsers.vue";
import RedditSubInfos from "./Widgets/Reddit/SubredditInformation.vue";
import WeatherCityTemperature from "./Widgets/Weather/CityTemperature.vue";
import Crypto from "./Widgets/Crypto/CryptoInfo.vue";
import Steam from "./Widgets/Steam/UserSteam.vue";
import TwitchGames from "./Widgets/Twitch/GetTopGames.vue";
import TwitchClips from "./Widgets/Twitch/GetClips.vue";
import jwt_decode from "jwt-decode";
export default {
  name: "dashboard",
  data() {
    return {
      availableWidgets: [
        RedditUserInfos,
        RedditSubInfos,
        RedditBrowseUsers,
        WeatherCityTemperature,
        Crypto,
        Steam,
        TwitchGames,
        TwitchClips,
      ],
      userWidgets: [],
      availableServices: {},
      serviceToAdd: {},
      widgetToAdd: {},
      dynamicDatas: {
        service: "",
        widget: "",
        config: {},
        email: ""
      },
      timers: [],
      formError: false,
      errorDescription: "",
    };
  },
  methods: {
    async getAvailable() {
      await Axios.get("http://localhost:8080/about.json")
        .then((response) => {
          this.availableServices = response.data.server.services;
        })
        .catch((e) => {
          console.log(e);
        });
      let email = jwt_decode(localStorage.getItem("jwt")).email;
      await Axios.get(`http://localhost:8080/api/dashboard/?email=${email}`)
        .then((response) => {
          this.loadWidgets(response.data);
        })
        .catch((e) => {
          console.log(e);
        });
      await Axios.get(`http://localhost:8080/api/services/?email=${email}`)
        .then((response) => {
          this.filterServices(response.data);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    closeModal () {
      this.formError = false;
      this.errorDescription = "";
      this.clearForm();
    },
    moveWidget (index, direction) {
      if ((index === 0 && direction === -1) || (index === this.userWidgets - 1 && direction === +1))
        return;
      var swapArrayElements = function (a, x, y) {
        if (a.length === 1) return a;
        a.splice(y, 1, a.splice(x, 1, a[y])[0]);
      };
      swapArrayElements(this.userWidgets, index, index + direction);
      let data = {
        idx: index,
        direction: direction,
        email: jwt_decode(localStorage.getItem("jwt")).email
      };
      this.$http.post("/dashboard/widgetOrder", data);
    },
    loadWidgets(widgetsList) {
      for (var i = 0; i < widgetsList.length; i++) {
        let newWidget = {
          id: widgetsList[i]._id,
          config: null,
          toLoad: null,
        };
        delete widgetsList[i]._id;
        newWidget.config = JSON.stringify(widgetsList[i]);
        for (const entry in this.availableWidgets) {
          if (Object.hasOwnProperty.call(this.availableWidgets, entry)) {
            if (widgetsList[i].widget == this.availableWidgets[entry].name) {
              newWidget.toLoad = this.availableWidgets[entry];
            }
          }
        }
        if (newWidget.toLoad === null) {
          console.log("failed to add widget");
          return;
        }
        this.addTimer(newWidget.id, widgetsList[i].config.refresh_rate);
        this.userWidgets.push(newWidget);
      }
    },
    doesRequireOauth(services, widget) {
      let requiredService = null;
      for (const entry in this.availableWidgets) {
        if (Object.hasOwnProperty.call(this.availableWidgets, entry)) {
          if (widget.name == this.availableWidgets[entry].name && this.availableWidgets[entry].needOauth === false) {
            return false;
          } else if (widget.name == this.availableWidgets[entry].name && this.availableWidgets[entry].needOauth === true) {
            requiredService = this.availableWidgets[entry].needService;
          }
        }
      }
      if (!requiredService) {
        return false;
      }
      for (const entry in services) {
        if (Object.hasOwnProperty.call(services, entry) && services[entry].name === requiredService) {
          return false;
        }
      }
      return true;
    },
    filterServices(data) {
      for (const entry in this.availableServices) {
        if (Object.hasOwnProperty.call(this.availableServices, entry)) {
          for (const widget in this.availableServices[entry].widgets) {
            if (Object.hasOwnProperty.call(this.availableServices[entry].widgets, widget) && this.doesRequireOauth(data, this.availableServices[entry].widgets[widget])) {
              this.availableServices[entry].widgets.splice(widget, 1);
            }
          }  
          if (this.availableServices[entry].widgets.length === 0) {
            this.availableServices.splice(entry, 1);
          }
        }
      }
    },
    chooseService(name) {
      this.serviceToAdd = this.availableServices.filter(function (el) {
        return el.name === name;
      });
      this.dynamicDatas.service = name;
      this.serviceToAdd = this.serviceToAdd[0].widgets;
    },
    chooseWidget(value) {
      this.dynamicDatas.widget = value.name;
      this.widgetToAdd = value;
    },
    submitConfig(bvModalEvt) {
      bvModalEvt.preventDefault();
      if (JSON.stringify(this.dynamicDatas.config) === "{}") {
        this.errorDescription = "Fill the parameters or quit with the cross in the right top corner";
        this.formError = true;
        return;
      } else if (!("refresh_rate" in this.dynamicDatas.config) || !/^\d+$/.test(this.dynamicDatas.config["refresh_rate"]) || this.dynamicDatas.config["refresh_rate"] < 120) {
        this.errorDescription = "Refresh rate must be only digits and at least 120s";
        this.formError = true;
        return;
      }
      var strObject = JSON.stringify(this.dynamicDatas.config);
      for (const value of Object.entries(this.widgetToAdd.params)) {
        var strValue = value[1].name;
        if (strObject.search(strValue) === -1) {
          console.log("Missing key " + strValue);
          this.errorDescription = "Missing value " + strValue;
          this.formError = true;
          return;
        } else if (!this.dynamicDatas.config[strValue].replace(/\s/g, "").length) {
          console.log("Missing value for " + strValue + " field");
          this.errorDescription = "Missing value for " + strValue + " field";
          this.formError = true;
          return;
        }
      }
      this.dynamicDatas.email = jwt_decode(localStorage.getItem("jwt")).email;
      this.errorDescription = "";
      this.formError = false;
      this.$nextTick(() => {
        this.$bvModal.hide("modal-prevent-closing");
      });
      this.addWidget();
    },
    addWidget() {
      let newId = 0;
      this.userWidgets.forEach((widget) => {
        if (widget.id > newId) {
          newId = widget.id;
        }
      });
      let newConfig = JSON.stringify(this.dynamicDatas);
      let newWidget = {
        id: newId + 1,
        config: newConfig,
        toLoad: null,
      };
      for (const entry in this.availableWidgets) {
        if (Object.hasOwnProperty.call(this.availableWidgets, entry)) {
          if (this.dynamicDatas.widget === this.availableWidgets[entry].name) {
            newWidget.toLoad = this.availableWidgets[entry];
          }
        }
      }
      if (newWidget.toLoad === null) {
        console.log("failed to add widget");
        return;
      }
      this.userWidgets.push(newWidget);
      this.addTimer(newWidget.id, this.dynamicDatas.config["refresh_rate"]);
      this.userWidgets.forEach((widget) => {
        if (widget.id > newId) {
          this.$http.post("/dashboard", widget);
        }
      });

      this.clearForm();
    },
    clearForm() {
      this.dynamicDatas = {
        service: "",
        widget: "",
        config: {},
      };
    },
    deleteWidget(index, Id) {
      let email = jwt_decode(localStorage.getItem("jwt")).email;
      this.$http.delete("/dashboard", {data : {widget: this.userWidgets[index], email: email}});
      this.userWidgets.splice(index, 1);
      this.deleteTimer(Id);
    },
    editConfig(config, index, Id) {
      var params = config;
      this.userWidgets[index].config = params;
      this.deleteTimer(Id);
      this.addTimer(Id, JSON.parse(params).config.refresh_rate);
      let data = {
        widget: this.userWidgets[index],
        email: jwt_decode(localStorage.getItem("jwt")).email
      };
      this.$http.put("/dashboard", data);
    },
    addTimer(id, rate) {
      const ref = "widget-" + id;

      let newInterval = setInterval(
        (function (scope, ref) {
          return function () {
            scope.$refs[ref][0].refresh();
          };
        })(this, ref), rate * 1000);

      this.timers.push({"id": ref, "timer": newInterval});
    },
    deleteTimer(Id) {
      let ref = 'widget-' + Id;
      let position = 0;
      for (const obj in this.timers) {
        if (Object.hasOwnProperty.call(this.timers, obj)) {
          if (this.timers[obj].id == ref) {
            clearInterval(this.timers[obj].timer);
            this.timers.splice(position, 1);
          }
          position++;
        }
      }
    }
  },
  mounted() {
    this.getAvailable();
  },
};
</script>

<style>
.widget-container {
  max-width: 100%;
  max-height: 100%;
  height: 100%;
  padding: 40px 40px 0 40px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.widget-container .v-btn__content {
  width: 100%;
  height: 100%;
  display: flex;
}

.contain-img {
  max-height: 100%;
  max-width: 100%;
}

.addWidget {
  min-width: 30px !important;
  min-height: 50px !important;
  position: fixed;
  right: 20px;
  bottom: 20px;
}

.listServices {
  display: flex;
  flex-direction: column;
}

.listServices button {
  width: 40%;
  margin: 0 auto 12px auto;
}

.listWidgets {
  display: flex;
  flex-direction: column;
}

.listWidgets button {
  width: 70%;
  margin: 0 auto 12px auto;
}

.myFieldSet {
  display: flex;
  flex-direction: column;
  padding: 0 5px;
  margin: 10px 0;
}

.myFieldSet input {
  padding: 0;
}

.myFieldSet label {
  font-weight: 500;
}
</style>