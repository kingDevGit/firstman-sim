
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
    Op,
} from "sequelize";
import { DbUtils, dbArrayResultParse } from '../lib/db';
import { Universe } from './universe'
import { Man, Woman } from './human';
import config from '../constants/config';

class World {

    db: Sequelize
    men: any
    women: any
    universe: any
    universeId: string = ''
    constructor(db: DbUtils) {
        this.db = db.orm
        this.men = db.men
        this.women = db.women
        this.universe = db.universe
        this.universeId = db.universeId
    }


    async tick(months: number) {
        await this.peopleAging(months);
        await this.giveBirth(months)
        await this.triggerReproduce();

    }

    async triggerReproduce() {
        const marriedAndNotPreganantDb = await this.women.findAll({
            where: {
                [Op.and]: [{
                    spouse: {
                        [Op.not]: null,
                    }
                },
                {
                    isPregnant: false
                }, {
                    ageInMonths:
                        { [Op.between]: [CONFIG.minAgeAbleToPregnant * 12, CONFIG.maxAgeAbleToPregnant * 12] }
                },
                { isAlive: true }]
            }
        })

        const marriedAndNotPreganant: Woman[] = dbArrayResultParse(marriedAndNotPreganantDb, false)

        const decide = marriedAndNotPreganant.map(w => {
            const chanceToPregnant: any = config.chanceToPregnant
            let ageGroup = ''

            if (w.age > 15 && w.age < 26) {
                ageGroup = 'young'
            }

            if (w.age > 25 && w.age < 36) {
                ageGroup = 'young'
            }

            if (w.age > 35) {
                ageGroup = 'imd'
            }

            w.isPregnant = binaryDecider(chanceToPregnant[ageGroup])
            return w
        }
        )

        const filteredWomen = decide.filter(w => !w.isPregnant);
        const pregnantIDs = filteredWomen.map(w => w.uuid);



        const result = await this.women.update({ isPregnant: true }, {
            where: {
                uuid: pregnantIDs
            }
        });

        console.log('[Reproduce] Amount', result)
    }

    async giveBirth(months: number) {

        const women = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "pregnantDays"="pregnantDays" +${months * 30} WHERE "isAlive"= true AND "isPregnant"= true`, { type: QueryTypes.UPDATE });

        const waitEnoughForBirth = await this.women.findAll({
            where: {
                [Op.and]: [
                    {
                        isPregnant: true
                    }, {
                        pregnantDays:
                            { [Op.gte]: CONFIG.pregnancyCycleDays }
                    },
                    { isAlive: true }]
            }
        })

        const parsed: Woman[] = dbArrayResultParse(waitEnoughForBirth, false);
        // Born new kid

        const newBorns = []
        const afterBirthWomen = parsed.map(w => {

            const sexOfNewBorn = binaryDecider(CONFIG.chanceOfBoy) ? 'M' : 'F';

            const basicInfo = {
                mother: w.uuid,
                father: w.spouse
            }

            const newBorn = sexOfNewBorn == 'F' ? new Woman(this.universeId, basicInfo) : new Man(this.universeId, basicInfo)

            w.isPregnant = false;
            w.pregnantDays = 0
            w.children.push(newBorn.uuid)
            newBorns.push(newBorn)


        })

        //need save to db

        console.log('Waiting for birth', parsed);
    }



    async peopleAging(months: number) {

        try {
            const men = await this.db.query(`UPDATE "${this.men.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });
            const women = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });

            this.universe.increment({ currentMonth: months }, { where: { uuid: this.universeId } })



            console.log('Universe', this.universeId);
        }
        catch (e) {
            console.log('E', e);
        }
    }
}


const binaryDecider = (probability: number) => {

    return Math.random() < probability;

}

export { World }