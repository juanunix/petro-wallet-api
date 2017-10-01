'use strict';

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
            return user.save({balance: user.get('balance')+parseFloat(value)},{ sessionToken: user.get("sessionToken") });
        }).then((user) => {
            return this.currentUser.fetch();
        }).then((user) => {
            return user.save({balance: user.get('balance')-parseFloat(value)},{ sessionToken: user.get("sessionToken") });
        }).then((user) => {
            this.response.success(user);
        }, (error) => {
            this.response.error(error);
        })
    }

    pay() {
        if(!this.currentUser){
            this.response.error({message: "Tem que estar logado..."});
            return;
        }

        const cpf = this.request.params.cpf;
        const purchase = this.request.params.purchase;
        const sbalance = this.currentUser.get("balance") || 0;
        // value = saldo do cara caso a compra seja efetivada
        const value = sbalance - purchase;

        if (cpf === undefined || purchase === undefined) {
            this.response.error({message: "Parâmetros inválidos!"});
            return;
        }

        if(value < 0){
            this.response.error({message: "Não há saldo suficiente!"});
            return;
        }

        let query = new Parse.Query(Parse.User);
        query.equalTo("username", cpf);

        // Ainda tem que realizar a retirada (balance - value) do saldo do usuário

        // query.first().then((user) => {
        //     user.increment("balance", value);
        //     return user.save();
        // }).then((user) => {
        //     this.currentUser.increment("balance", -value);
        //     return this.currentUser.save();
        // }).then((user) => {
        //     this.response.success(user);
        // }, (error) => {
        //     this.response.error(error);
        // })
    }
}

Parse.Cloud.define('transferBalance', (req, res) => {
    new Balance(req, res).transfer();
});

Parse.Cloud.define('pay', (req, res) => {
    new Balance(req, res).pay();
});