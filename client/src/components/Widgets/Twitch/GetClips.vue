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


    <div v-if="this.error_m === ''">
      <h2 class="category-title">Top clips</h2>
    </div>
    <div v-if="this.error_m === ''" class="myWidget-category-content">
      <div v-for="(clip, i) in clips" :key="i" class="clip-card">
        <div class="clip-description">
          <a :href="clip.url">
            <img src="../../../assets/link.png" alt="Category icon" class="link-clip">
          </a>
          <p>{{ clip.title }}</p>
        </div>
        <img :src="clip.thumbnail_url" alt="">
      </div>
    </div>

    <div v-if="this.error_m != ''" class="myWidget-category-content">
      {{ this.error_m }}
    </div>

    <b-modal
        :id="'modal-edit-config-' + widgetId"
        :title="myConfig['service'] + ' : ' + myConfig['widget']"
        @ok="submitConfig"
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
      </div>
    </b-modal>
  </div>
</template>

<script>
import Axios from "../../../http-common";
import jwt_decode from "jwt-decode";
export default {
  name: "get_clips",
  needOauth: true,
  needService: "Twitch",
  props: ["config", "widgetIdx", "widgetId"],
  data() {
    return {
      clips: [],
      error_m: "",
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
    };
  },
  methods: {
    async getUserInfos() {
      const email = jwt_decode(localStorage.getItem("jwt")).email;
      console.log(this.myConfig.config);
      await Axios.get(`/twitch/clips/?email=${email}&username=${this.myConfig.config.username}&clips=${this.myConfig.config.amount}`)
          .then((response) => {
            if (response.status === 200) {
              console.log(JSON.stringify(response.data.data));
              this.clips = response.data.data;
              this.error_m = "";
            }
          })
          .catch((e) => {
            this.error_m = "Authentificate to Twitch service please."
            console.log(e);
          });
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
    sendTolink(url) {
      window.location.href = url;
    },
    submitConfig(bvModalEvt) {
      bvModalEvt.preventDefault();
      if (JSON.stringify(this.parameters) === "{}") {
        return;
      } else if ( !("refresh_rate" in this.parameters) || !/^\d+$/.test(this.parameters["refresh_rate"])) {
        return;
      }
      for (const value of Object.entries(this.parameters)) {
        var strValue = value[0];
        if (!this.parameters[strValue].replace(/\s/g, "").length) {
          console.log("Missing value for " + strValue + " field");
          return;
        }
      }
      this.hideEdit();
      this.myConfig.config = this.parameters
      this.sendEditConfig();
      this.refresh();
    },
    refresh() {
      this.getUserInfos();
      console.log("refresh component id:", this.widgetId);
    },
    sendDelete() {
      this.$emit("delete_widget", this.widgetIdx, this.widgetId);
    },
    sendEditConfig() {
      this.$emit("edit_config", JSON.stringify(this.myConfig), this.widgetIdx, this.widgetId);
    },
    moveWidgets (id, direction) {
      this.$emit("move_widget",  id, direction);
    }
  },
  mounted() {
    this.getUserInfos();
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
  border-radius: 10px;
  background-color: whitesmoke;
  font-family: 'Lato', sans-serif;
}

.myWidget-content-clips {
  padding: 5px 32px 20px 32px;
  border-radius: 0 0 8px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(100% - 45px);
  justify-content: space-around;
}

.myWidget-content-clips p {
  margin: auto;
  width: fit-content;
}

.myWidget-data-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0 10px 0;
}

.myWidget-data-icon img {
  max-width: 40px;
  max-height: 40px;
  border-radius: 100%;
}

.myButton {
  background:linear-gradient(to bottom, #c123de 5%, #a20dbd 100%);
  background-color:#c123de;
  border-radius:20px;
  border:1px solid #a511c0;
  display:inline-block;
  cursor:pointer;
  color:#ffffff;
  font-family:Arial;
  font-size:12px;
  font-weight:bold;
  margin-top: 10px;
  padding:6px 22px;
  text-decoration:none;
  text-shadow:0px 1px 0px #9b14b3;
}
.myButton:hover {
  background:linear-gradient(to bottom, #a20dbd 5%, #c123de 100%);
  background-color:#a20dbd;
}
.myButton:active {
  position:relative;
  top:1px;
}


.myWidget-data-icon p {
  height: fit-content;
  margin: auto !important;
  transform: translateX(-15px);
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
  margin: 10px 0 0 20px;
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

.clip-card {
  width: 100%;
  height: fit-content;
  display: flex;
  flex-direction: column;
  margin: 0 auto 10px 0;
  align-self: center;
  background-color: lightgray;
  border-radius: 10px;
  border: solid 2px darkgray;
}


.clip-card img {
  max-width: 170px;
  max-height: 170px;
  margin: 0 auto 5px auto;
  border-radius: 8px;
}

.clip-card p {
  font-size: 10pt;
  margin: auto;
  width: fit-content;
  max-width: 65%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transform: translateX(-15px);
}

.link-clip {
  width: 30px;
  height: 30px;
  padding: 5px;
}

.clip-description {
  display: flex;
  flex-direction: row;
  width: 100%;
}

</style>