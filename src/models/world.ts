
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
import { Universe } from './universe'

class World extends Universe {

    db: Sequelize
    men: any
    women: any
    universe: any

    constructor(db: DbUtils) {
        super();
        this.db = db.orm
        this.men = db.men
        this.women = db.women
    }


    async tick() {
        await this.peopleAging(3);

    }



    async peopleAging(months: number) {

        try {
            const men = await this.db.query(`UPDATE "${this.men.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });
            const women = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });
        }
        catch (e) {
            console.log('E', e);
        }
    }

}


export { World }