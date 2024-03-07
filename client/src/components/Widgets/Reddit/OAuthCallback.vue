<template>
  <v-row align="center" class="list px-3 mx-auto avoidHeader">
    <p>Check authentication...</p>    
    <p> {{ oauthStatus }} </p>
  </v-row>
</template>

<script>
import axios from '../../../http-common';
import jwt_decode from "jwt-decode";
export default {
  name: "OAuthCallback",
  data() {
    return {
      oauthStatus: "In progress"
    };
  },
  methods: {
    async sendCode() {
      const urlParams = new URLSearchParams(window.location.search);
      let code = urlParams.get("code");
      var data = {
        code: code,
        email: jwt_decode(localStorage.getItem("jwt")).email
      };
      await axios.post(`/reddit/oauth?code=${code}`, data)
        .then((response) => {
          if (response.data.status == "Successful login to service") {
            this.oauthStatus = "Successful";
          } else {
            this.oauthStatus = "Failed";
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
  },
  mounted() {
    this.sendCode();
  },
};
</script>

<style>
.avoidHeader {
  margin: 12px !important;
  align-content: center;
  display: flex;
  flex-direction: column;
}
.avoidHeader p {
  width: auto;
}
</style>
