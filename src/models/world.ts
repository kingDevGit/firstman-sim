
import CONFIG from '../constants/config'
import {
    Sequelize,
    QueryTypes,
    Model,
    ModelDefined,
    DataTypes,
    HasManyGetAssociationsMixin,
    HasManyAddAssociationMixin,
    HasManyHasAssociationMixin,
    Association,
    HasManyCountAssociationsMixin,
    HasManyCreateAssociationMixin,
    Optional,
} from "sequelize";
import { DbUtils } from '../lib/db';

class World {

    db: Sequelize
    men: any
    women: any

    constructor(db: DbUtils) {

        this.db = db.orm
        this.men = db.men
        this.women = db.women
    }


    async tick() {






    }



    async peopleAging() {

        try {
            const men = await this.db.query(`UPDATE '${this.men.getTableName()}' SET 'age'='age' +1 WHERE 'isAlive'= true`, { type: QueryTypes.UPDATE });
            const women = await this.db.query(`UPDATE '${this.women.getTableName()}' SET 'age'='age' +1 WHERE 'isAlive'= true`, { type: QueryTypes.UPDATE });


            const noah = await this.men.findAll({
                where: {
                    name: 'Noah'
                }
            })
            console.log('NOAH age', noah)
        }
        catch (e) {
            console.log('E', e);
        }
    }




    currentYear: number = 0
    population: number = 0

}


export { World }