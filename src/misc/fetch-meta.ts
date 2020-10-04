import { Meta } from '../models/entities/meta';
import { getConnection } from 'typeorm';

let cache: Meta;

export async function fetchMeta(noCache = false): Promise<Meta> {
	if (!noCache && cache) return cache;

	return await getConnection().transaction(async transactionalEntityManager => {
		// 過去のバグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
		const meta = await transactionalEntityManager.findOne(Meta, {
			order: {
				id: 'DESC'
			}
		});

		if (meta) {
			cache = meta;
			return meta;
		} else {
			const saved = await transactionalEntityManager.insert(Meta, {
				id: 'x'
			}).then(x => transactionalEntityManager.findOneOrFail(Meta, x.identifiers[0]));

			cache = saved;
			return saved;
		}
	});
}

setInterval(() => {
	fetchMeta(true).then(meta => {
		cache = meta;
	});
}, 5000);
