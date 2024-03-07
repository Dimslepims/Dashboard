<template>
  <div class="weather-wrapper">

    <div class="weather-card">
      <div class="weather-buttonControl">
        <b-button @click="moveWidgets(widgetIdx, -1)" title="move to left">
          <img src="../../../assets/left-arrow.png" alt="">
        </b-button>
        <b-button @click="moveWidgets(widgetIdx, +1)" title="move to right">
          <img src="../../../assets/right-arrow.png" alt="">
        </b-button>
        <b-button @click="refresh" title="refresh information">
          <img src="../../../assets/refresh.png" alt="">
        </b-button>
        <b-button v-b-modal @click="showEdit" title="edit widget">
          <img src="../../../assets/editing.png" alt="">
        </b-button>
        <b-button @click="sendDelete" title="delete widget">
          <img src="../../../assets/delete.png" alt="">
        </b-button>
      </div>

      <div class="weather-icon" :id="'weatherIcon' + widgetId" :ref="'weatherIcon-' + widgetId"></div>
      <div class="weather-infos">
        <div class="weather-infos-temperature">
          <h1 class="weather-infos-temperature-title">
            {{ formatTemperature(weather.daily[0].temp.day) }}°
          </h1>
          <div class="weather-infos-temperature-minmax">
            <p>Min&nbsp;{{ formatTemperature(weather.daily[0].temp.min) }}°</p>
            <p>Max {{ formatTemperature(weather.daily[0].temp.max) }}°</p>  
          </div>
        </div>
        <p> {{ myConfig.config.city }} </p>
      </div>
    </div>

    <b-modal
      :id="'modal-edit-config-' + widgetId"
      :title="myConfig['service'] + ' : ' + myConfig['widget']"
      @ok="submitConfig"
      @close="closeModal"
      ok-only
    >
      <div class="listWidgets">
        <h3>Parameters</h3>
        <div v-for="(key, value, index) in parameters" :key="index">
          <fieldset class="myFieldSet">
            <label :for="value"> {{ value }} </label>
            <input
              v-model="parameters[value]"
              :placeholder="value"
              :id="value"
              required
            />
          </fieldset>
        </div>
        <p v-if="formError" style="color: red; text-align: center;">{{ errorDescription }}</p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Axios from "../../../http-common";
export default {
  name: "city_temperature",
  needOauth: false,
  needService: "Reddit",
  props: ["config", "widgetIdx", "widgetId"],
  data() {
    return {
      weather: {},
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
      formError: false,
      errorDescription: "",
    };
  },
  methods: {
    async getWeatherForecast() {
      await Axios.get(`/weather/?city=${this.myConfig.config.city}`)
        .then((response) => {
          this.weather = response.data;
          this.setWeatherIcon(response.data);
        })
        .catch((e) => {
          console.log(e);
        });
    },
    formatTemperature(temp) {
      return Math.floor(temp);
    },
    showEdit() {
      let modal = "modal-edit-config-" + this.widgetId;
      this.$nextTick(() => {
        this.$bvModal.show(modal);
      });
    },
    hideEdit() {
      let modal = "modal-edit-config-" + this.widgetId;
      this.$nextTick(() => {
        this.$bvModal.hide(modal);
      });
    },
    closeModal () {
      this.formError = false;
      this.errorDescription = "";
      this.clearForm();
    },
    submitConfig(bvModalEvt) {
      bvModalEvt.preventDefault();
      if (JSON.stringify(this.parameters) === "{}") {
        this.errorDescription = "Fill the parameters or quit with the cross in the right top corner";
        this.formError = true;
        return;
      } else if (!("refresh_rate" in this.parameters) || !/^\d+$/.test(this.parameters["refresh_rate"] || this.parameters["refresh_rate"] < 120)) {
        this.errorDescription = "Refresh rate must be only digits and at least 120s";
        this.formError = true;
        return;
      }
      for (const value of Object.entries(this.parameters)) {
        var strValue = value[0];
        if (!this.parameters[strValue].replace(/\s/g, "").length) {
          console.log("Missing value for " + strValue + " field");
          this.errorDescription = "Missing value for " + strValue + " field";
          this.formError = true;
          return;
        }
      }
      this.errorDescription = "";
      this.formError = false;
      this.myConfig.config = this.parameters;
      this.hideEdit();
      this.sendEditConfig();
      this.refresh();
    },
    setWeatherIcon(forecast) {
      if (forecast.daily[0].weather[0].main === "Clear") {
        setTimeout(
          (function (scope) {
            return function () {
              let ref = scope.$refs["weatherIcon-" + scope.widgetId];
              ref.className = "";
              ref.classList.add("weather-icon", "sun");
            };
          })(this),
          500
        );
      } else if (
        forecast.daily[0].weather[0].main === "Clouds" ||
        forecast.daily[0].weather[0].main === "Snow"
      ) {
        setTimeout(
          (function (scope) {
            return function () {
              let ref = scope.$refs["weatherIcon-" + scope.widgetId];
              ref.className = "";
              ref.classList.add("weather-icon", "cloud");
            };
          })(this),
          500
        );
      } else if (forecast.daily[0].weather[0].main === "Rain") {
        setTimeout(
          (function (scope) {
            return function () {
              let ref = scope.$refs["weatherIcon-" + scope.widgetId];
              ref.className = "";
              ref.classList.add("weather-icon", "rain");
            };
          })(this),
          500
        );
      }
    },
    refresh() {
      this.getWeatherForecast();
      console.log("refresh component id:", this.widgetId);
    },
    sendDelete() {
      this.$emit("delete_widget", this.widgetIdx, this.widgetId);
    },
    sendEditConfig() {
      this.$emit(
        "edit_config",
        JSON.stringify(this.myConfig),
        this.widgetIdx,
        this.widgetId
      );
    },
    moveWidgets (id, direction) {
      this.$emit("move_widget",  id, direction);
    }
  },
  mounted() {
    this.getWeatherForecast();
  },
  beforeDestroy() {
    var id = window.setTimeout(function () {}, 0);

    while (0 <= id) {
      window.clearTimeout(id);
      id--;
    }
  },
};
</script>

<style>
@import url(https://fonts.googleapis.com/css?family=Lato:100,300,400,700,900);

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

.weather-buttonControl {
  position: absolute;
  left: 20px;
  top: 15px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  border-radius: 7px 7px 0 0;
}

.weather-buttonControl button {
  background-color: white;
  max-height: 25px;
  max-width: 25px;
  padding: 2px;
  border: none;
  margin-right: 3px;
}

.weather-buttonControl button img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

@import url(https://fonts.googleapis.com/css?family=Lato:100,300,400,700,900);

*,
*:before,
*:after {
  box-sizing: border-box;
}

.weather-wrapper {
  margin: 20px 30px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
}

.weather-card {
  margin: 0;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  width: 300px;
  height: 300px;
  background-color: white;
  box-shadow: 0px 0px 25px 1px rgba(50, 50, 50, 0.1);
  animation: appear 500ms ease-out forwards;
}

.weather-infos {
  position: absolute;
  width: calc(100% - 35px);
  left: 35px;
  bottom: 20px;
  display: flex;
  flex-direction: column;
  height: fit-content;
  justify-items: flex-end;
}

.weather-card p {
  margin: 0;
  font-family: "Lato", sans-serif;
  font-weight: 300;
  font-size: 28px;
  color: lighten(#b8b8b8, 10%);
  bottom: 0;
  left: 35px;
  animation: title-appear 1s ease-out 500ms forwards;
}

.weather-icon {
  position: relative;
  width: 50px;
  height: 50px;
  top: 0;
  float: right;
  margin: 40px 40px 0 0;
  animation: weather-icon-move 5s ease-in-out infinite;
}

.weather-infos-temperature {
  display: flex;
  flex-direction: row;
}

.weather-infos-temperature-title {
  display: inline-block;
  font-family: "Lato", sans-serif;
  font-weight: 300;
  font-size: 80px;
  color: #b8b8b8;
  bottom: 0;
  left: 35px;
  opacity: 0;
  transform: translateX(150px);
  animation: title-appear 500ms ease-out 500ms forwards;
  margin: 0;
  height: fit-content;
  line-height: 1;
}

.weather-infos-temperature-minmax {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.weather-infos-temperature-minmax p {
  font-family: "Lato", sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #b8b8b8;
  opacity: 0;
  animation: title-appear 500ms ease-out 500ms forwards;
  margin: 0;
}

.sun {
  background: #ffcd41;
  border-radius: 50%;
  box-shadow: rgba(255, 255, 0, 0.1) 0 0 0 4px;
  animation: light 800ms ease-in-out infinite alternate,
    weather-icon-move 5s ease-in-out infinite;
}

@keyframes light {
  from {
    box-shadow: rgba(255, 255, 0, 0.2) 0 0 0 10px;
  }
  to {
    box-shadow: rgba(255, 255, 0, 0.2) 0 0 0 17px;
  }
}

.cloud {
  margin-right: 60px;
  background: #b6cede;
  border-radius: 20px;
  width: 25px;
  height: 25px;
  box-shadow: #b6cede 24px -6px 0 2px, #b6cede 10px 5px 0 5px,
    #b6cede 30px 5px 0 2px, #b6cede 11px -8px 0 -3px, #b6cede 25px 11px 0 -1px;
}

.rain {
  margin-right: 60px;
  background: #b6cede;
  border-radius: 20px;
  width: 25px;
  height: 25px;
  box-shadow: #b6cede 24px -6px 0 2px, #b6cede 10px 5px 0 5px,
    #b6cede 30px 5px 0 2px, #b6cede 11px -8px 0 -3px, #b6cede 25px 11px 0 -1px;
}

.rain::after {
  content: "";
  position: absolute;
  border-radius: 10px;
  background-color: transparent;
  width: 4px;
  height: 12px;
  left: 0;
  top: 31px;
  transform: rotate(30deg);
  animation: rain 800ms ease-in-out infinite alternate;
}

@keyframes rain {
  from {
    box-shadow: #2092a9 8px 0px, #2092a9 32px -6px, #2092a9 20px 0px;
  }
  to {
    box-shadow: #2092a9 8px 6px, #2092a9 32px 0px, #2092a9 20px 6px;
  }
}

@keyframes weather-icon-move {
  50% {
    transform: translateY(-8px);
  }
}

.inspiration {
  margin-top: 80px;
  color: darken(#c8dae6, 25%);
  font-family: "Lato", sans-serif;
  font-weight: 300;
  font-size: 24px;
  text-align: center;
}

.inspiration a {
  color: #ff8f8f;
  font-weight: 400;
  animation: all 300ms ease-in-out;
}

@keyframes appear {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.05);
  }
  75% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes title-appear {
  from {
    opacity: 0;
    transform: translateX(150px);
  }
  to {
    opacity: 1;
    transform: translateX(0px);
  }
}
</style>