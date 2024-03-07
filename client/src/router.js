import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";
import jwt_decode from "jwt-decode";

Vue.use(Router);

const router = new Router({
  mode: "history",
  routes: [
    {
      path: "/home",
      name: "home",
      component: () => import("./components/Dashboard"),
      // meta: {
      //   requiresAuth: true
      // }
    },
    {
      path: "/",
      name: "login",
      component: () => import("./views/login.vue"),
      meta: {
        alreadyLogin: true
      }
    },
    {
      path: "/register",
      name: "register",
      component: () => import("./views/register.vue")
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("./views/admin.vue"),
      meta: {
        requiresAdmin: true
      }
    },
    {
      path: "/profile",
      name: "profile",
      component: Home,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/services",
      name: "services",
      component: () => import("./components/ServicesList"),
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/oauth_callback",
      name: "oauth_callback",
      component: () => import("./components/Widgets/Reddit/OAuthCallback")
    },
    {
      path: "/twitch_oauth_callback",
      name: "twitch_oauth_callback",
      component: () => import("./components/Widgets/Twitch/TwitchOAuthCallback")
    },
  ]
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (localStorage.getItem("jwt") == null) {
      next({
        path: "/"
      });
    } else {
      next();
    }
  } else if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (localStorage.getItem("jwt") == null || jwt_decode(localStorage.getItem("jwt")).admin  === false) {
      next({
        path: "/"
      });
    } else {
      next();
    }
  }else if (to.matched.some(record => record.meta.alreadyLogin)) {
    if (localStorage.getItem("jwt") != null) {
      next({
        path: "/home"
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router