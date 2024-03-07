<template>
  <div class="myWidget" :ref="'browseUser-' + widgetId">
    <div class="buttonControl">
      <b-button @click="moveWidgets(widgetIdx, -1)" title="move to left">
        <img src="../../../assets/left-arrow.png" alt="">
      </b-button>
      <b-button @click="moveWidgets(widgetIdx, +1)" title="move to right">
        <img src="../../../assets/right-arrow.png" alt="">
      </b-button>
      <b-button @click="refresh">
        <img src="../../../assets/refresh.png" alt="">
      </b-button>
      <b-button v-b-modal @click="showEdit">
        <img src="../../../assets/editing.png" alt="">
      </b-button>
      <b-button @click="sendDelete">
        <img src="../../../assets/delete.png" alt="">
      </b-button>
    </div>

    <div class="myWidget-content-steam" v-if="this.user.name !== ''">
      <div class="myWidget-data-icon-steam">
        <img :src="this.user.avatarUrl" alt="">
        <div class="myWidget-content-title-steam">
          <p> <b> Profile Url </b> <a :href="this.user.profileUrl"> {{this.user.profileUrl}} </a></p>
          <p> <b> Name </b> <br>{{this.user.name}}</p>
          <p> <b> Country </b> <br>{{this.user.country}}</p>
        </div>
      </div>
    </div>

    <div class="myWidget-content-error-steam" v-if="this.user.name === ''">
      User not found.
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
  name: "userSteam",
  props: ["config", "widgetIdx", "widgetId"],
  data() {
    return {
      user: {
        name: "",
        country: "",
        profileUrl: "",
        avatarUrl: "",
      },
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
      formError: false,
      errorDescription: "",
    };
  },
  methods: {
    async getUserInfos() {
      await Axios.get(`/steam/?steamId=${this.myConfig.config.steamId}`)
          .then((response) => {
            console.log(response);
            this.user.avatarUrl = response.data.response.players[0].avatarfull;
            this.user.country = response.data.response.players[0].loccountrycode;
            this.user.profileUrl = response.data.response.players[0].profileurl;
            this.user.name = response.data.response.players[0].personaname;
            //console.log(this.user.avatarUrl);
          })
          .catch((e) => {
            window.Swal("Error", "No User found", "error");
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
      } else if ( !("refresh_rate" in this.parameters) || !/^\d+$/.test(this.parameters["refresh_rate"]) || this.parameters["refresh_rate"] < 120) {
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
  border-radius: 20px;
  background-color: #66B4F9;
  font-family: 'Lato', sans-serif;
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
  justify-content: flex-end;
  border-radius: 7px 7px 0 0;
  padding: 10px 0 0 80px;
}

.buttonControl button {
  background: rgba(0,0,0,0);
  max-height: 35px;
  max-width: 35px;
  padding: 6px;
  border: none;
  margin-right: 3px;
}

.buttonControl button img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* Style for steam */

.myWidget-content-steam {
  display: flex;
  flex-direction: row;
  padding: 5px 32px 20px 32px;
  border-radius: 0 0 8px 8px;
  margin: auto;
  height: calc(100% - 45px);
  justify-content: space-evenly;
}

.myWidget-content-title-steam {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  font-size: 18pt;
}

.myWidget-content-error-steam {
  display: flex;
  justify-content: space-around;
  font-size: 18pt;
}

.myWidget-content-title-steam p{
  margin-left: 30px;
  font-size: 10pt;
}

.myWidget-content-title-steam b{
  font-size: 12pt;
}


.myWidget-data-icon-steam {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 0 0 10px 0;
}

.myWidget-data-icon-steam img {
  max-width: 70px;
  max-height: 70px;
  border-radius: 100%;
}

.myWidget-content-crypto p {
  margin: 0;
  width: fit-content;
}

</style>