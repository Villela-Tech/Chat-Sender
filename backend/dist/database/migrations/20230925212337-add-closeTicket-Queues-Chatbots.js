"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.addColumn("Queues", "closeTicket", {
            type: sequelize_1.DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false
        }),
            queryInterface.addColumn("Chatbots", "closeTicket", {
                type: sequelize_1.DataTypes.BOOLEAN,
                defaultValue: false,
                allowNull: false
            });
    },
    down: (queryInterface) => {
        return queryInterface.removeColumn("Queues", "closeTicket"),
            queryInterface.removeColumn("Chatbots", "closeTicket");
    }
};
