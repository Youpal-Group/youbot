import Mongo from 'mongodb';
import { logger } from './utils';

class Database {
	public db: Mongo.Db | undefined;
	private mongoClient: Mongo.MongoClient;

	constructor(config: any) {
		const mngClient = Mongo.MongoClient;
		this.mongoClient = {} as Mongo.MongoClient;
		this.db = undefined;

		mngClient.connect(config.mongoUrl, { useUnifiedTopology: true }, (err, db) => {
			if (err) {
				logger.error('MongoDB', err);
			} else {
				this.mongoClient = db;
				this.db = db.db(config.mongoDb);
				logger.info('MongoDB', 'Connected');
			}
		});

		process.on('exit', () => {
			this.mongoClient.close();
		});
	}

	update(message: any) {
		return new Promise((resolve, reject) => {
			if (this.db) {
				this.db.collection('qnas').updateOne(
					{ _id: message.savedId },
					{
						$set: {
							answer: message.message,
							updated: Date.now()
						}
					},
					(err) => {
						if (err) {
							reject(err);
						}

						return resolve(true);
					}
				);
			}
			else return resolve(false);
		});
	}

	save(message: any) {
		return new Promise((resolve, reject) => {
			if (this.db) {
				this.db.collection('qnas').insertOne(
					{
						question: message.message,
						created: Date.now()
					},
					(err, res) => {
						if (err) {
							return reject(err);
						}

						return resolve(res.insertedId);
					}
				);
			}
			else return resolve(false);
		});
	}
}

export default Database;
