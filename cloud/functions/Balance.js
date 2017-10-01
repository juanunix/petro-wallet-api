'use strict';
import Parse from 'parse';

class Balance {
    constructor(request, response){
        this.request = request;
        this.response = response;
        this.currentUser = request.user;
    }

    transfer() {
        if(!this.currentUser){
            this.response.error({message: "Tem que estar logado..."});
            return;
        }

        const cpf = this.request.params.cpf;
        const value = this.request.params.value;
        const sbalance = this.currentUser.get("balance") || 0;

        if(cpf === undefined || value === undefined || value > sbalance){
            this.response.error({message: "Parametros invalidos..."});
            return;
        }

        let query = new Parse.Query(Parse.User);
        query.equalTo("username", cpf);
        query.first().then((user) => {
            user.increment("balance", value);
            return user.save();
        }).then((user) => {
            this.currentUser.increment("balance", -value);
            return this.currentUser.save();
        }).then((user) => {
            this.response.success(user);
        }, (error) => {
            this.response.error(error);
        })
    }
}

Parse.Cloud.define('transferBalance', (req, res) => {
   new Balance(req, res).transfer();
});