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
            user.set("balance", user.get('balance')+parseFloat(value));
            return user.save(null, {useMasterKey:true});
        }).then((user) => {
            return this.currentUser.fetch();
        }).then((user) => {
            user.set("balance", user.get('balance')-parseFloat(value));
            return user.save(null, {useMasterKey:true});
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

        if (cpf === undefined || purchase === undefined) {
            this.response.error({message: "Parâmetros inválidos!"});
            return;
        }

        const value = sbalance - purchase;
        if(value < 0){
            this.response.error({message: "Não há saldo suficiente!"});
            return;
        }

        let query = new Parse.Query(Parse.User);
        query.equalTo("username", cpf);

        try {
            query.first()
                .then((user) => {
                    return this.currentUser.fetch();
                })
                .then((user) => {
                    user.set("balance", parseFloat(value));
                    return user.save(null, {useMasterKey:true});
                })
                .then((user) => {
                    this.response.success(user);
                }, (error) => {
                    this.response.error(error);
                })
        } catch (Error) {
            this.response.error({message: "Não foi possível realizar operação!"});
            return;
        }
    }

    getClientData(){
        if(!this.currentUser){
            this.response.error({message: "Tem que estar logado..."});
            return;
        }

        const data = this.request.params.identification;
        if(data === undefined){
            this.response.error({message: "Parametros invalidos..."});
            return;
        }

        let query;
        if(data.length === 11){
            query = new Parse.Query(Parse.User);
            query.equalTo('username', data);
        } else if(data.length === 7){
            query = new Parse.Query("Vehicle");
            query.equalTo("plate", data);
        } else {
            this.response.error({message: "Parametro deve ser um CPF ou uma placa..."});
            return;
        }

        query.first().then((obj) => {
            if(!obj) {
                this.response.error({message: "Usuário não encontrado..."});
                return;
            }

            const result = obj.get('owner') || obj;
            this.response.success(result);
        }, (error) => {
            this.response.error(error);
        });
    }
}

Parse.Cloud.define('transferBalance', (req, res) => {
    new Balance(req, res).transfer();
});

Parse.Cloud.define('pay', (req, res) => {
    new Balance(req, res).pay();
});

Parse.Cloud.define('getClientData', (req, res) => {
    new Balance(req, res).getClientData();
});