<template>
  <div class="myWidget">
    <div class="buttonControl">
      <b-button @click="refresh">
        <img src="../../assets/refresh.png" alt="">
      </b-button>
      <b-button v-b-modal @click="showEdit">
        <img src="../../assets/editing.png" alt="">
      </b-button>
      <b-button @click="sendDelete">
        <img src="../../assets/delete.png" alt="">
      </b-button>
    </div>

    <div class="myWidget-content">
      <!-- PUT YOUR CONTENT HERE -->
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
export default {
  name: "widget_name",                        // Must be the same as in about.json
  props: ["config", "widgetIdx", "widgetId"], // These properties are mandatory
  data() {
    return {
      myConfig: JSON.parse(this.config),
      parameters: JSON.parse(JSON.stringify(JSON.parse(this.config))).config,
    };
  },
  methods: {
    showEdit() {                                            // Toggle editing modal
      let modal = "modal-edit-config-" + this.widgetId;
      this.$nextTick(() => {
        this.$bvModal.show(modal);
      });
    },
    hideEdit() {                                            // Toggle editing modal
      let modal = "modal-edit-config-" + this.widgetId;
      this.$nextTick(() => {
        this.$bvModal.hide(modal);
      });
    },
    submitConfig(bvModalEvt) {                              // Validate and store edited configuration
      bvModalEvt.preventDefault();
      if (JSON.stringify(this.parameters) === "{}") {
        return;
      } else if ( !("refresh_rate" in this.parameters) || !/^\d+$/.test(this.parameters["refresh_rate"]) || this.parameters["refresh_rate"] < 120) {
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
    },
    refresh() {                                             // Your must have a function called refresh, it is called by dashboard automatically
      console.log("refresh component id:", this.widgetId);
    },
    sendDelete() {                                          // Don't touch this function, it deletes widget automatically
      this.$emit("delete_widget", this.widgetIdx, this.widgetId);
    },
    sendEditConfig() {                                      // Don't touch this function, it sends new widget config automatically
      this.$emit("edit_config", JSON.stringify(this.myConfig), this.widgetIdx, this.widgetId);
    },
  },
  mounted() {
    this.getUserInfos();
  },
};
</script>

<style>
.myWidget {
  max-width: 100%;
  margin: 20px 30px;
  width: 250px;
  border: solid 2px black;
  border-radius: 10px;
}

.myWidget-content {
  padding: 12px;
  background-color: #d4d4d4;
  border-radius: 0 0 8px 8px;
}

.myWidget-content h2 {
  display: flex;
  justify-content: left;
  font-size: 24pt;
}

.myWidget-content p {
  margin-bottom: 5px;
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
  justify-content: space-evenly;
  border-radius: 7px 7px 0 0;
  background-color: #272727;
  /* padding: 10px 0; */
}

.buttonControl button {
  background: rgba(0,0,0,0);
  max-height: 40px;
  max-width: 40px;
  padding: 6px;
}

.buttonControl button img {
  max-width: 100%;
  max-height: 100%;
}
</style>