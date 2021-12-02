import { Man, Woman } from '../models/human';
import { firstWoman, firstMan } from '../constants/first-men'
import { Database } from 'sqlite3';
import {
    Sequelize,
    QueryTypes,
    Model,
    literal,
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
import { World } from '../models/world';
import { Universe } from '../models/universe';

class DbUtils {


    constructor() {

    }

    async bootstrap() {

        await this.startDatabase();
        await this.testOrm();
        await this.setupTable();
    }


    async startDatabase() {
        console.log('[Sqlite3] Connecting')
        return new Promise<void>((resolve, reject) => {
            this.db = new Database(':memory:', (err: any) => {
                if (err) {
                    return console.error(err.message);
                }
                console.log('[Sqlite3] Connected to the in-memory SQlite database.');

                console.log('[ORM] Connecting to ORM...')

                this.orm = new Sequelize('sqlite::memory:')

                return resolve()
            });
        })
    }

    async testOrm() {
        try {
            await this.orm.authenticate();
            console.log('[ORM] Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    }

    async setupTable() {

        try {

            this.men = this.orm.define('Men', modelTrans(new Man('void')), {
                freezeTableName: true
            });

            this.women = this.orm.define('Women', modelTrans(new Woman('void')), {
                freezeTableName: true
            });

            this.universe = this.orm.define('Universe', modelTrans(new Universe()), {
                freezeTableName: true
            })

            await this.orm.sync({ force: true });
            const universe = await this.universe.create(new Universe());
            this.universeId = universe.uuid;
            console.log('UNIVERSE ID', this.universeId)
            const noah: any = await this.men.create(new Man(universe.uuid, firstMan));
            const ademy: any = await this.women.create(new Woman(universe.uuid, firstWoman));

            console.log(`[ORM] Table created with one man ${noah.name} with expected life of ${noah.expectedLife}`,);
            console.log(`[ORM] Table created with one man ${ademy.name} with expected life of ${ademy.expectedLife}`,);


        } catch (e) {

            console.log('Error', e);
        }

    }


    orm!: Sequelize
    men: any
    women: any
    universe: any
    universeId: string = ''
    db!: Database

    close() {
        return new Promise<void>((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    return reject(console.error(err.message));
                }

                console.log('Close the database connection.');
                return resolve();

            });
        })

    }

}


const modelTrans = (model: any) => {

    let propertiesNames = Object.getOwnPropertyNames(model);

    const trans = propertiesNames.map(m => {

        return { name: m, type: typeof model[m] }
    })

    let ormModel: any = {};

    trans.map(t => {
        ormModel[t.name] = t.type == 'object' ? {

            type: typeTrans(t.type),
            get() {
                const rawValue = this.getDataValue(t.name);
                if (typeof rawValue === 'string') {

                    return JSON.parse(rawValue);
                } else {
                    return rawValue
                }
            },
            set(value: any) {
                this.setDataValue(t.name, JSON.stringify(value));
            }
        } : {
            type: typeTrans(t.type)
        }

    })
    return ormModel
}

const typeTrans = (type: string) => {
    switch (type) {
        case 'string': return DataTypes.STRING;
        case 'boolean': return DataTypes.BOOLEAN;
        case 'number': return DataTypes.INTEGER;
        case 'object': return DataTypes.STRING;

        default: return DataTypes.STRING
    }

}

const dbArrayResultParse = (array: any, isMan: boolean = true) => {

    const result = array.map((a: any) => isMan ? new Man(a.dataValues.universeId, a.dataValues) : new Woman(a.dataValues.universeId, a.dataValues))
    return result
}

export { DbUtils, dbArrayResultParse }