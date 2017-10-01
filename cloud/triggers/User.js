Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	var user = request.object;

	if(user.isNew()) {
        user.set("balance", 0);
        response.success();
        return;
    }

	if(user.dirty('balance')) {
		let query = new Parse.Query(Parse.User);
		query.get(user.id).then((oldUser) => {
			try {
                if (!oldUser) {
                    response.success();
                    return;
                }
                const value = oldUser.get("balance") - user.get("balance");
                console.log("----->",user.id);
                let history = new Parse.Object("History");
                console.log("2----->",user.id);
                history.set("user", user);
                history.set("value", value);
                console.log("3----->",user.id);

                return history.save();
            } catch (error){
                console.log("4----->",error);
                response.error(error);
			}
		}).then(() => {
            console.log("5----->",user);
			response.success();
		}, (error) => {
            console.log("6----->",error);
			response.error(error);
		});
	} else {
		response.success();
	}
});

Parse.Cloud.beforeSave("Session", function (request, response) {
	var session = request.object;
	let query = new Parse.Query("Session");
	query.equalTo("user", session.get("user")).first((s) => {
		if(!s){
			response.success();
			return;
		}

		return s.destroy();
	}).then(() => {
		response.success();
	}, (error) => {
		response.error(error);
	})
});