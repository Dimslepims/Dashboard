<template>
   <v-app>
     <div class="general">
      <v-app-bar app dark>
        <div class="d-flex align-center mr-2">
          Dashboard
        </div>

        <v-btn class="headerButtons" to="/home" v-if="isJWT() === true" text>
          Home
        </v-btn>

        <v-btn class="headerButtons" to="/services"  v-if="isJWT() === true" text>
          Services
        </v-btn>
        
        <v-btn class="headerButtons" to="/profile" v-if="isJWT() === true" text>
          Account
        </v-btn>

        <v-btn class="headerButtons" to="/admin" v-if="checkJWT() === true" text>
          Admin
        </v-btn>

      </v-app-bar>

      <v-main>
        <router-view />
      </v-main>
     </div>
  </v-app>
</template>

<script>

import jwt_decode from "jwt-decode";

export default {
  name: 'App',

  data: () => ({
    //
  }),
  methods: {
    checkJWT() {
      if ( localStorage.getItem("jwt") != null && jwt_decode(localStorage.getItem("jwt")).admin  === true) {
        return true;
      } else {
        return false;
      }
    },
    isJWT() {
      if (localStorage.getItem("jwt") != null) {
        return true;
      } else {
        return false;
      }
    }
  }
};
</script>

<style>

.general {
  background-color: #d4d4d4;
  height: 100%;
}

.headerButtons {
  margin: auto 0 auto 10px;
  height: 90% !important;
}

</style>