<template>
  <div>
    <table class="table mt-5">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, i) in userList" :key="i">
          <th scope="row">{{ ++i }}</th>
          <td>{{ user.Username }}</td>
          <td>{{ user.Email }}</td>
          <td><font-awesome-icon icon="trash" @click="deleteOneUser(user)"/></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
export default {
  data() {
    return {
      userList: {
        Username: "",
        Email: "",
        Id: "",
      },
    };
  },
  methods: {
    async retrieveAllUsers() {
      let response = await this.$http.get("/user/admin");
      this.userList = response.data.user.map((item) => {
        return {
          Username: item.name,
          Email: item.email,
          Id: item._id,
        };
      });
    },
    async deleteOneUser(user) {
      await this.$http.delete("/user/admin", {data: user});
      this.retrieveAllUsers();
    }
  },
  created() {
    this.retrieveAllUsers();
  },
};
</script>
<style></style>
