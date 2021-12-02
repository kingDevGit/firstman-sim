import { v4 } from 'uuid';

class Universe {

    constructor() {
        this.currentMonth = 0
        this.population = 0
        this.uuid = v4()
    }


    uuid: string
    currentMonth: number
    population: number

    get currentYear() {
        return this.currentMonth / 12;
    }

}
export { Universe }