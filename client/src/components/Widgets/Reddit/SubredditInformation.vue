<template>
  <div class="myWidget">
    <div class="buttonControl" title="refresh information">
      <b-button @click="moveWidgets(widgetIdx, -1)" title="move to left">
        <img src="../../../assets/left-arrow.png" alt="">
      </b-button>
      <b-button @click="moveWidgets(widgetIdx, +1)" title="move to right">
        <img src="../../../assets/right-arrow.png" alt="">
      </b-button>
      <b-button @click="refresh">
        <img src="../../../assets/refresh.png" alt="">
      </b-button>
      <b-button v-b-modal @click="showEdit" title="edit widget">
        <img src="../../../assets/editing.png" alt="">
      </b-button>
      <b-button @click="sendDelete" title="delete widget">
        <img src="../../../assets/delete.png" alt="">
      </b-button>
    </div>

    <div class="myWidget-content">
      <h2 class="myWidget-content-title">{{ subreddit.name }}</h2>
      <p>{{ subreddit.description }}</p>
      <div class="myWidget-data-stats">
        <div class="myWidget-data-stats-item">
          <p class="myWidget-data-stats-title" >{{ formatNumber(subreddit.subscribers, 1) }}</p>
          <p class="myWidget-data-stats-description">Subscribers</p>
        </div>
        <div class="myWidget-data-stats-item">
          <p class="myWidget-data-stats-title">{{ formatNumber(subreddit.active_users, 1) }}</p>
          <p class="myWidget-data-stats-description">Active members</p>
        </div>
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
  name: "subreddit_information",
  needOauth: false,
  needService: "Reddit",
  props: ["config", "widgetIdx", "widgetId"],
  data() {
    return {
      subreddit: {
        name: "",
        description: "",
        subscribers: 0,
        active_users: 0,
      },
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
      formError: false,
      errorDescription: "",
    };
  },
  methods: {
    async getSubredditInfos() {
      await Axios.get("/reddit/subreddit", {
        params: { sub_name: this.myConfig.config.subreddit_name },
      })
        .then((response) => {
          if (response.status != 200) return;
          this.subreddit.name = response.data.data.display_name_prefixed;
          this.subreddit.description = response.data.data["public_description"];
          this.subreddit.subscribers = response.data.data["subscribers"];
          this.subreddit.active_users = response.data.data["accounts_active"];
        })
        .catch((e) => {
          console.log(e);
        });
    },
    formatNumber(num, digits) {
      const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "K" },
        { value: 1e6, symbol: "M" },
      ];
      const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
      var item = lookup.slice().reverse().find(function (item) {
          return num >= item.value;
        });
      return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
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
      } else if (
        !("refresh_rate" in this.parameters) || !/^\d+$/.test(this.parameters["refresh_rate"] || this.parameters["refresh_rate"] < 120)) {
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
      this.hideEdit();
      this.myConfig.config = this.parameters;
      this.sendEditConfig();
      this.getSubredditInfos();
    },
    refresh() {
      console.log("refresh component id:", this.widgetId);
      this.getSubredditInfos();
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
    this.getSubredditInfos();
  },
};
</script>

<style>
@import url(https://fonts.googleapis.com/css?family=Lato:100,300,400,700,900);

.myWidget {
  max-width: 100%;
  margin: 20px 30px;
  width: 300px;
  border: none;
  border-radius: 20px;
  background-color: #66b4f9;
  font-family: "Lato", sans-serif;
}

.myWidget-content {
  display: flex;
  flex-direction: column;
  padding: 5px 32px 20px 32px;
  border-radius: 0 0 8px 8px;
  height: calc(100% - 45px);
  justify-content: space-evenly;
}

.myWidget-content-title {
  font-size: 18pt;
  text-align: center;
  width: fit-content;
  margin: 0 auto 5px auto;
}

.myWidget-content p {
  margin: 5px auto 10px auto;
  width: fit-content;
  text-align: center;
}


.myWidget-data-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.myWidget-data-stats-item {
  display: flex;
  flex-direction: column;
}

.myWidget-data-stats-title {
  font-size: 22px;
  font-weight: 600;
  line-height: 24px;
  margin: 0 !important;
}

.myWidget-data-stats-description {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  margin: 0 !important;
}

.myWidget-data-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.myWidget-data-icon img {
  max-width: 40px;
  max-height: 40px;
  border-radius: 100%;
}

.myWidget-data-icon p {
  height: fit-content;
  transform: translateX(-15px);
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

.buttonControl {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  border-radius: 7px 7px 0 0;
  margin: 10px  0 0 20px;
}

.buttonControl button {
  background: rgba(0,0,0,0);
  max-height: 25px;
  max-width: 25px;
  padding: 2px;
  border: none;
  margin-right: 3px;
}

.buttonControl button img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}
</style>