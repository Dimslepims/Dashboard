<template>
  <div align="center" class="services-main">
    <h1>Services</h1>
    <div class="services-list">
      <h2>Reddit</h2> 
      <v-btn v-if="!connected" class="serviceButton" @click="redirectOAuth">
        Sign in with Reddit
      </v-btn>
      <v-btn v-if="connected" class="serviceButton" @click="revokeToken">
        Revoke token
      </v-btn>
      <h2>Twitch</h2>
      <v-btn v-if="!connectedTwitch" class="serviceButton" @click="redirectTwitchOAuth">
        Sign in with Twitch
      </v-btn>
      <v-btn v-if="connectedTwitch" class="serviceButton" @click="revokeTokenTwitch">
        Revoke token
      </v-btn>
    </div>
  </div>
</template>

<script>
import Axios from 'axios'
import jwt_decode from "jwt-decode";
export default {
  name: "services-list",
  data() {
    return {
      connected: false,
      connectedTwitch: false,
      email: ""
    };
  },
  methods: {
    async isConnected() {
      if (this.email.length < 1)
        return;
      await Axios.get(`http://localhost:8080/api/services/?email=${this.email}`)
        .then((response) => {
          for (let i = 0; i < response.data.length; i++) {
            console.log(JSON.stringify(response.data[i]));
            if (response.data[i].name === 'Reddit') {
              this.connected = true;
            }
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    async isConnectedTwitch() {
      if (this.email.length < 1)
        return;
      await Axios.get(`http://localhost:8080/api/services/?email=${this.email}`)
          .then((response) => {
            for (let i = 0; i < response.data.length; i++) {
              console.log(JSON.stringify(response.data[i]));
              if (response.data[i].name === 'Twitch') {
                this.connectedTwitch = true;
              }
            }
          })
          .catch((e) => {
            console.log(e);
          });
    },
    async revokeToken() {
      Axios.post(`http://localhost:8080/api/reddit/revoke/`, {email: this.email})
        .then((response) => {
          console.log("revoke operation", response.data);
          this.connected = false;
        })
        .catch((e) => {
          console.log(e);
        });
    },
    async revokeTokenTwitch() {
      Axios.post(`http://localhost:8080/api/twitch/revoke/`, {email: this.email})
          .then((response) => {
            console.log("revoke operation", response.data);
            this.connectedTwitch = false;
          })
          .catch((e) => {
            console.log(e);
          });
    },
    redirectOAuth() {
      location.assign("https://www.reddit.com/api/v1/authorize?api_key&client_id=Y3wx2SfTchkt7Ai2v2CGdg&redirect_uri=http://localhost:8081/oauth_callback&response_type=code&scope=identity%20account&state=my_random_string&duration=permanent");
    },
    redirectTwitchOAuth() {
      location.assign("https://id.twitch.tv/oauth2/authorize?client_id=84ywaahm7orgmuraq6aqqnsb8a9934&redirect_uri=http://localhost:8081/twitch_oauth_callback&response_type=code&scope=user:read:email&state=");
    }
  },
  mounted() {
    this.email = jwt_decode(localStorage.getItem("jwt")).email;
    this.isConnected();
    this.isConnectedTwitch();
  },
};
</script>

<style>

.v-main__wrap {
  height: 100% !important;
}

.serviceButton {
  max-width: 40%;
  margin: auto
}

.services-main {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 40px;
}

.services-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-content: center;
  padding: 40px 0;
}

.services-list h2 {
  position: initial;
  /* margin: auto auto 0 auto; */
}
</style>
