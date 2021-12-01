import { v4 } from 'uuid';
const randomName = require('node-random-name');
import { normalRandomScaled } from '../lib/random'
import CONFIG from '../constants/config'
class Human {

    constructor() {
        this.uuid = v4()

    }
    uuid: string
    name: string = ''
    expectedLife: number = normalRandomScaled(CONFIG.lifeExpectancy, CONFIG.lifeDev)
    age: number = 0
    gender: string = ''
    children: Array<string> = [];
    isAlive: boolean = true;
    bornYear: number = 0
    father: string = ''

}



class Woman extends Human {


    constructor() {
        super();
        this.gender = 'F'
        this.name = randomName({ gender: 'female' })
    }
    spouse: string = '';
    isPregant: boolean = false;
    pregnantDays: number = 0;

}

class Man extends Human {

    constructor() {
        super();
        this.gender = 'M'
        this.name = randomName({ gender: 'male' })
    }

    spouses: Array<string> = [];

}

export { Man, Woman }