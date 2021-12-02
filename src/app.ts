import { Man, Woman } from './models/human';
import { DbUtils } from './lib/db';
import { World } from './models/world';


const buildWorld = async () => {

    const db = new DbUtils();
    await db.bootstrap();
    const world = new World(db)
    await world.tick(3);
}


buildWorld();



