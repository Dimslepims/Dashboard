<template>
  <div class="myWidget-crypto" :ref="'browseUser-' + widgetId">
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

    <div class="myWidget-content-crypto" v-if="info.name != '' ">
      <div class="myWidget-content-title-crypto">
        {{ this.info.name }}
        <p v-if="this.info.change >= 0" class="stonks"> {{(this.info.change).toFixed(2)}} %</p>
        <p v-if="this.info.change < 0" class="notStonks"> {{(this.info.change).toFixed(2)}} %</p>
      </div>
      <p>
        {{this.info.symbol}}
      </p>
      <div class="myWidget-content-corpse-crypto">
        <p>
          <b>Worth in USD : </b>
        </p>
        <p>
          {{(this.info.worth_in_usd).toFixed(2)}}
        </p>
      </div>
      <div class="myWidget-content-corpse-crypto">
        <p>
          <b> Volume : </b>
        </p>
        <p>
          {{(this.info.volume).toFixed(2)}}
        </p>
      </div>
      <div class="myWidget-content-corpse-crypto">
        <p>
          <b> Open : </b>
        </p>
        <p>
          {{(this.info.open).toFixed(2)}}
        </p>
      </div>
    </div>

    <div class="myWidget-content-crypto" v-if="info.name === '' ">
      <h1 class="myWidget-content-title-crypto"> No crypto found </h1>
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
  name: "crypto_currency",
  props: ["config", "widgetIdx", "widgetId"],
  data() {
    return {
      info: {
        name: "",
        symbol: "",
        worth_in_usd: 0,
        volume: 0,
        open: 0,
        change: 0,
      },
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
      formError: false,
      errorDescription: "",
    };
  },
  methods: {
    async getUserInfos() {
      await Axios.get(`/crypto/?cryptoname=${this.myConfig.config.cryptoname}`)
          .then((response) => {
            this.info.name = response.data.data.name;
            this.info.symbol = response.data.data.symbol;
            this.info.worth_in_usd = response.data.data.market_data.price_usd;
            this.info.volume = response.data.data.market_data.volume_last_24_hours;
            this.info.open = response.data.data.market_data.ohlcv_last_1_hour['open'];
            this.info.change = response.data.data.market_data.percent_change_usd_last_1_hour;
          })
          .catch((e) => {
            window.Swal("Error", "No crypto found", "error");
            this.info.name = "";
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

.myWidget-crypto {
  max-width: 100%;
  margin: 20px 30px;
  width: 300px;
  border: none;
  border-radius: 20px;
  background-color: whitesmoke;
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

/* Style for crypto */

.myWidget-content-crypto {
  display: flex;
  flex-direction: column;
  padding: 5px 32px 20px 32px;
  border-radius: 0 0 8px 8px;
  margin: auto;
  height: calc(100% - 45px);
  justify-content: space-between;
}

.myWidget-content-title-crypto {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 18pt;
}

.myWidget-content-title-crypto p{
  padding: 10px;
  font-size: 10pt;
}

.stonks {
  background-color: rgba(0, 255, 0, 0.6);
  border-radius: 20%;
}

.notStonks {
  background-color: rgba(255, 0, 0, 0.6);
  border-radius: 20%;
}

.myWidget-content-crypto p {
  margin: 0;
  width: fit-content;
}

.myWidget-content-corpse-crypto{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

</style>