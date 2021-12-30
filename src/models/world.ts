
import CONFIG from '../constants/config'
import {
    Sequelize,
    QueryTypes,
    Model,
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
        await this.giveBirth();
        await this.triggerMarriage();
        await this.triggerReproduce();
        await this.dustYouShallReturn();
    }

    async triggerReproduce() {
        console.time('reproduce');

        const marriedAndNotPreganantDb = await this.women.findAll({
            where: {
                [Op.and]: [{
                    spouse: {
                        [Op.not]: '',
                    }
                },
                { isResting: false },
                {
                    isPregnant: false
                }, {
                    ageInMonths:
                        { [Op.between]: [CONFIG.ageAbleToPregnant[0] * 12, CONFIG.ageAbleToPregnant[1] * 12] }
                },
                { isAlive: true },
                ]
            }
        })

        const marriedAndNotPreganant: Woman[] = dbArrayResultParse(marriedAndNotPreganantDb, false)

        if (marriedAndNotPreganant.length == 0) {
            console.timeEnd('reproduce');
            return
        }

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
                ageGroup = 'mid'
            }

            w.isPregnant = binaryDecider(chanceToPregnant[ageGroup] * 0.5, 'REPRODUCT')
            return w
        }
        )

        const filteredWomen = decide.filter(w => w.isPregnant);
        const pregnantIDs = filteredWomen.map(w => w.uuid);

        if (pregnantIDs.length > 0) {
            const result = await this.women.update({ isPregnant: true }, {
                where: {
                    uuid: pregnantIDs
                }
            });
            //console.log('[Reproduce] Amount', result)
        }
        console.timeEnd('reproduce');


    }
    async triggerMarriage() {
        console.time('Marriage');
        const singleWomenDb = await this.women.findAll({
            where: {
                [Op.and]: [{ spouse: '' },
                { ageInMonths: { [Op.between]: [CONFIG.girlAgeAbleToBeMarried[0] * 12, CONFIG.girlAgeAbleToBeMarried[1] * 12] } }, { isAlive: true }]
            }, order: [['ageInMonths', 'DESC']]
        });

        const menDb = await this.men.findAll({
            where: { [Op.and]: [{ ageInMonths: { [Op.between]: [CONFIG.boyAgeAbleToBeMarried[0] * 12, CONFIG.boyAgeAbleToBeMarried[1] * 12] } }, { isAlive: true }] }
            , order: [['spousesCount', 'ASC'], ['ageInMonths', 'DESC']]
        });

        const singleWomen = dbArrayResultParse(singleWomenDb, false);
        const men = dbArrayResultParse(menDb, true)

        const marriedWomen: Woman[] = []
        const marriedMen: Man[] = [];

        for (let i = 0; i < singleWomen.length; i++) {
            const selectedW: Woman = singleWomen[i];
            const selectedM: Man = men[i]

            if (!!selectedW && !!selectedM) {
                selectedW.spouse = selectedM.uuid;
                selectedM.spousesCount += 1;

                marriedMen.push(selectedM)
                marriedWomen.push(selectedW);
                men.shift();
            } else {
                break;
            }
        }

        const updateMenDb = marriedMen.length > 0 ? await this.men.bulkCreate(marriedMen,
            {
                updateOnDuplicate: ["spousesCount"]
            }) : null;



        const updateWomenDb = marriedWomen.length > 0 ? await this.women.bulkCreate(marriedWomen,
            {
                updateOnDuplicate: ["spouse"]
            }) : null;

        console.timeEnd('Marriage');

    }

    async giveBirth() {

        console.time('Give birth');

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

        const newBornGirls: any[] = []
        const newBornBoys: any[] = []
        const afterBirthWomen = parsed.map(w => {

            const sexOfNewBorn = binaryDecider(CONFIG.chanceOfBoy, 'SE') ? 'M' : 'F';

            const basicInfo = {
                mother: w.uuid,
                father: w.spouse
            }

            const newBorn = sexOfNewBorn == 'F' ? new Woman(this.universeId, basicInfo) : new Man(this.universeId, basicInfo)

            w.isPregnant = false;
            w.pregnantDays = 0

            if (binaryDecider(CONFIG.babySurvivalRate)) {
                if (sexOfNewBorn == 'F') {
                    newBornGirls.push(newBorn)
                }
                else {
                    newBornBoys.push(newBorn)
                }
            }

            return w
        })

        const finishedWomenId = afterBirthWomen.map(w => w.uuid);

        if (newBornGirls.length > 0) {
            const createWoman = await this.women.bulkCreate(newBornGirls)
        }


        if (newBornBoys.length > 0) {
            const createMan = await this.men.bulkCreate(newBornBoys)
        }

        const womenResult = await this.women.update({ isPregnant: false, pregnantDays: 0, isResting: true, }, {
            where: {
                uuid: finishedWomenId
            }
        });
        console.timeEnd('Give birth');


    }
    async dustYouShallReturn() {
        console.time('Dust');

        const menDieTick = await this.db.query(`UPDATE "${this.men.getTableName()}" SET "isAlive"=false WHERE "isAlive"= true AND "ageInMonths">="expectedLife"*12`, { type: QueryTypes.UPDATE });
        const womenDieTick = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "isAlive"=false WHERE "isAlive"= true AND "ageInMonths">="expectedLife"*12`, { type: QueryTypes.UPDATE });

        console.timeEnd('Dust')
    }



    async peopleAging(months: number) {
        console.time('aging');

        const menAgingTick = await this.db.query(`UPDATE "${this.men.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });
        const womenAgingTick = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "ageInMonths"="ageInMonths" +${months} WHERE "isAlive"= true`, { type: QueryTypes.UPDATE });
        const pregnantMonthsTick = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "pregnantDays"="pregnantDays" +${months * 30} WHERE "isAlive"= true AND "isPregnant"= true`, { type: QueryTypes.UPDATE });
        const restingWomenTick = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "restMonths"="restMonths" +${months} WHERE "isAlive"= true AND "isResting"=true`, { type: QueryTypes.UPDATE });
        const unrestWomen = await this.db.query(`UPDATE "${this.women.getTableName()}" SET "isResting"=false,"restMonths"=0  WHERE "isAlive"= true AND "restMonths">=${CONFIG.monthsRestAfterDeliverBaby}`, { type: QueryTypes.UPDATE });

        this.universe.increment({ currentMonth: months }, { where: { uuid: this.universeId } })
        console.timeEnd('aging');

    }

    async totalSummary(){
        const menAgingTick = await this.db.query(`
       SELECT MAX("CHILD"),"father" FROM (SELECT "father", COUNT("father") AS "CHILD" from (SELECT "father" from  "${this.men.getTableName()}" UNION ALL SELECT "father" from "${this.women.getTableName()}") GROUP BY "father")`, { type: QueryTypes.SELECT });

        console.log('TOTAL SUMMARY', menAgingTick);
    }

    async summary() {
        const menAliveCount = await this.men.count({
            where: {
                isAlive: true
            }
        })
        const womenAliveCount = await this.women.count({
            where: {
                isAlive: true
            }
        })

        const menDeadCount = await this.men.count({
            where: {
                [Op.not]: {
                    isAlive: true
                }
            }
        })
        const womenDeadCount = await this.women.count({
            where: {
                [Op.not]: {
                    isAlive: true
                }
            }
        })

        const toxicJJCount = await this.men.count({
            where: {
                [Op.and]: [{
                    isAlive: true
                },
                {
                    spousesCount: 0
                },
                {
                    ageInMonths: {
                        [Op.gt]: CONFIG.boyAgeAbleToBeMarried[1] * 12
                    }
                }]
            }
        })

        const universe = await this.universe.findOne({ where: { uuid: this.universeId } })
        const maxSpouses = await this.men.max('spousesCount');
        const menMaxLife = await this.men.max('ageInMonths', { where: { isAlive: false } });
        const menMinLife = await this.men.min('ageInMonths', { where: { isAlive: false } });
        const unpregantW = await this.women.count({where:{ [Op.and]:[{isAlive:true},{isPregnant:true},{ageInMonths:{[Op.between]:[CONFIG.ageAbleToPregnant[0]*12,CONFIG.ageAbleToPregnant[1]*12]}}]}})


        console.log('Men life range', menMinLife / 12, ' - ', menMaxLife / 12)
        console.log('Alive Human count', menAliveCount, womenAliveCount)
        console.log('Dead men count', menDeadCount, womenDeadCount)
        console.log('Toxic JJ', toxicJJCount);
        console.log('Max Spouses', maxSpouses);
        console.log('Universe years passed', universe.dataValues.currentMonth / 12)
        console.log('Unpregant Women',unpregantW)


        return {
            yearPassed: Math.round(universe.dataValues.currentMonth / 12),
            population: menAliveCount + womenAliveCount
        }

    }
}


const binaryDecider = (probability: number, remark?: string) => {
    const result = Math.random() < probability;

    // console.log('Decided for probability ', remark, probability, result)

    return result

}

export { World }