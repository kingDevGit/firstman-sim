import { v4 } from 'uuid';
const randomName = require('node-random-name');
import { normalRandomScaled } from '../lib/random'
import CONFIG from '../constants/config'
class Human {

    constructor(universeId: string) {
        this.uuid = v4()
        this.universeId = universeId

    }
    uuid: string
    name: string = ''
    expectedLife: number = normalRandomScaled(CONFIG.lifeExpectancy, CONFIG.lifeDev)
    ageInMonths: number = 0
    gender: string = ''
    children: Array<string> = []
    isAlive: boolean = true;
    bornYear: number = 0
    father: string = ''
    mother: string = ''
    universeId: string = ''


    get age() {
        return this.ageInMonths / 12
    }

}



class Woman extends Human {


    constructor(universe: string, init?: Partial<Woman>) {
        super(universe);
        this.gender = 'F'
        this.name = randomName({ gender: 'female' })
        if (!!init) {
            Object.assign(this, init)
        }
    }
    spouse: string = '';
    isPregnant: boolean = false;
    pregnantDays: number = 0;

}

class Man extends Human {

    constructor(universe: string, init?: Partial<Man>) {
        super(universe);
        this.gender = 'M'
        this.name = randomName({ gender: 'male' })
        if (!!init) {
            Object.assign(this, init)
        }
    }

    spouses: Array<string> = [];

}

export { Man, Woman }