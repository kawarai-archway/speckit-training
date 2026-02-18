/**
 * インメモリ商品リポジトリ
 * デモ・テスト用
 *
 * 注意: Next.js開発モードではHMRによりモジュールが再読み込みされるため、
 * グローバル変数を使用してデータを保持しています。
 */
import type { Product } from '@/contracts/catalog';
import type { ProductRepository } from '@/contracts/catalog';

/**
 * ベースデータ（サンプル互換・不変）
 * サンプルテストが依存するデータセット。変更禁止。
 * 本番機能追加時は EXTENSION_PRODUCTS に追加すること。
 */
export const BASE_PRODUCTS: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'E2Eテスト商品',
    price: 3000,
    description: 'E2Eテスト用のデモ商品です。',
    imageUrl: 'https://picsum.photos/seed/test/400/400',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'ミニマルTシャツ',
    price: 4980,
    description: 'シンプルで上質なコットン100%のTシャツ。どんなスタイルにも合わせやすい定番アイテムです。',
    imageUrl: 'https://picsum.photos/seed/tshirt/400/400',
    status: 'published',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'レザーウォレット',
    price: 12800,
    description: '職人が一つ一つ手作りした本革財布。使い込むほど味わいが増します。',
    imageUrl: 'https://picsum.photos/seed/wallet/400/400',
    status: 'published',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'キャンバストートバッグ',
    price: 6800,
    description: '丈夫なキャンバス生地を使用したシンプルなトートバッグ。A4サイズも余裕で収納できます。',
    imageUrl: 'https://picsum.photos/seed/bag/400/400',
    status: 'published',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'ウールニット',
    price: 15800,
    description: 'メリノウール100%の上質なニット。軽くて暖かく、チクチクしません。',
    imageUrl: 'https://picsum.photos/seed/knit/400/400',
    status: 'published',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'デニムパンツ',
    price: 9800,
    description: '日本製セルビッジデニムを使用したストレートパンツ。長く愛用できる一本です。',
    imageUrl: 'https://picsum.photos/seed/denim/400/400',
    status: 'draft',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

/**
 * 拡張データ（本番追加分）
 * 本番機能実装時にここにデータを追加する。
 * ベースデータとの ID 重複を避けること。
 */
export const EXTENSION_PRODUCTS: Product[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'オーガニックコットンシャツ',
    price: 7980,
    description: 'オーガニックコットン100%のシャツ。肌触りが良く、環境にも優しいサステナブルなアイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop',
    stock: 25,
    status: 'published',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'シルクスカーフ',
    price: 8500,
    description: '上質なシルク素材のスカーフ。エレガントなアクセントとして、様々なスタイルに合わせられます。',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    stock: 12,
    status: 'published',
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-02'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'リネンパンツ',
    price: 11800,
    description: 'フレンチリネンを使用した涼しげなパンツ。夏のカジュアルスタイルに最適です。',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
    stock: 8,
    status: 'published',
    createdAt: new Date('2024-02-03'),
    updatedAt: new Date('2024-02-03'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440013',
    name: 'レザーベルト',
    price: 5800,
    description: 'イタリアンレザーを使用したクラシカルなベルト。ビジネスからカジュアルまで幅広く活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    stock: 30,
    status: 'published',
    createdAt: new Date('2024-02-04'),
    updatedAt: new Date('2024-02-04'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440014',
    name: 'カシミヤマフラー',
    price: 19800,
    description: '最高級カシミヤ100%のマフラー。軽くて暖かく、上品な光沢が特徴です。',
    imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440015',
    name: 'スニーカー ホワイト',
    price: 13800,
    description: '上質なレザーを使用した白スニーカー。ミニマルなデザインでどんなコーデにもマッチします。',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    stock: 15,
    status: 'published',
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440016',
    name: 'ボーダーTシャツ',
    price: 5480,
    description: 'フランス製のボーダーTシャツ。定番のマリンスタイルで季節を問わず活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
    stock: 20,
    status: 'published',
    createdAt: new Date('2024-02-07'),
    updatedAt: new Date('2024-02-07'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440017',
    name: 'チノパンツ',
    price: 8800,
    description: '厚手のチノクロスを使用したパンツ。オフィスカジュアルにも対応できる万能アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop',
    stock: 18,
    status: 'published',
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440018',
    name: 'サングラス クラシック',
    price: 16800,
    description: 'クラシックなウェリントン型サングラス。UVカット機能付きで実用性も兼ね備えています。',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-02-09'),
    updatedAt: new Date('2024-02-09'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440019',
    name: 'ダウンジャケット',
    price: 29800,
    description: '高品質ダウンを使用した軽量ジャケット。寒い冬でも暖かく過ごせます。',
    imageUrl: 'https://images.unsplash.com/photo-1544923246-77307dd270b5?w=400&h=400&fit=crop',
    stock: 5,
    status: 'published',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: 'コットンソックス 3足セット',
    price: 2480,
    description: '柔らかなコットン素材のソックス3足セット。毎日の快適さをサポートします。',
    imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop',
    stock: 50,
    status: 'published',
    createdAt: new Date('2024-02-11'),
    updatedAt: new Date('2024-02-11'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'リュックサック',
    price: 14800,
    description: '撥水加工を施したナイロンリュック。通勤からアウトドアまで幅広く活躍します。',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    stock: 10,
    status: 'published',
    createdAt: new Date('2024-02-12'),
    updatedAt: new Date('2024-02-12'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: 'ポロシャツ',
    price: 6800,
    description: '鹿の子素材のポロシャツ。ゴルフやテニスなどスポーツシーンにもおすすめです。',
    imageUrl: 'https://images.unsplash.com/photo-1625910513413-5fc421e0e2d4?w=400&h=400&fit=crop',
    stock: 22,
    status: 'published',
    createdAt: new Date('2024-02-13'),
    updatedAt: new Date('2024-02-13'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440023',
    name: 'ウォッチ シルバー',
    price: 24800,
    description: 'シンプルなデザインのシルバーウォッチ。ビジネスシーンにも映える上品な時計です。',
    imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
    stock: 7,
    status: 'published',
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-02-14'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440024',
    name: 'ストローハット',
    price: 4980,
    description: '天然素材のストローハット。夏のコーディネートに爽やかさをプラスします。',
    imageUrl: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=400&fit=crop',
    stock: 0,
    status: 'published',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440025',
    name: 'レインコート',
    price: 18800,
    description: '防水透湿素材を使用したスタイリッシュなレインコート。雨の日もおしゃれに過ごせます。',
    imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop',
    stock: 14,
    status: 'published',
    createdAt: new Date('2024-02-16'),
    updatedAt: new Date('2024-02-16'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440026',
    name: 'カードケース',
    price: 3980,
    description: '本革製のスリムなカードケース。名刺やクレジットカードをスマートに収納できます。',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    stock: 35,
    status: 'published',
    createdAt: new Date('2024-02-17'),
    updatedAt: new Date('2024-02-17'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440027',
    name: 'プレミアムTシャツ',
    price: 9800,
    description: 'スーピマコットンを使用した最高級Tシャツ。極上の着心地を実現しました。',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    stock: 16,
    status: 'published',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440028',
    name: 'フランネルシャツ',
    price: 8980,
    description: '起毛加工を施したフランネルシャツ。秋冬のカジュアルスタイルの定番アイテムです。',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop',
    stock: 11,
    status: 'published',
    createdAt: new Date('2024-02-19'),
    updatedAt: new Date('2024-02-19'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440029',
    name: 'ヴィンテージデニムジャケット',
    price: 22800,
    description: 'ヴィンテージ加工を施したデニムジャケット。こなれた雰囲気が魅力の一着です。',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
    stock: 3,
    status: 'draft',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
];

// グローバル変数の型定義（HMR対策）
declare global {
  // eslint-disable-next-line no-var
  var __productStore: Map<string, Product> | undefined;
}

// インメモリストア
// HMR対策：グローバル変数を使用してデータを保持
function initializeProductStore(): Map<string, Product> {
  if (globalThis.__productStore) {
    return globalThis.__productStore;
  }
  const allProducts = [...BASE_PRODUCTS, ...EXTENSION_PRODUCTS];
  const store = new Map<string, Product>(allProducts.map((p) => [p.id, p]));
  globalThis.__productStore = store;
  return store;
}

const products = initializeProductStore();

function generateId(): string {
  return crypto.randomUUID();
}

export const productRepository: ProductRepository = {
  async findAll(params) {
    let items = Array.from(products.values());

    if (params.status) {
      items = items.filter((p) => p.status === params.status);
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw))
      );
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.slice(params.offset, params.offset + params.limit);
  },

  async findById(id) {
    return products.get(id) || null;
  },

  async create(data) {
    const now = new Date();
    const product: Product = {
      id: generateId(),
      name: data.name,
      price: data.price,
      description: data.description,
      imageUrl: data.imageUrl,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    };
    products.set(product.id, product);
    return product;
  },

  async update(id, data) {
    const existing = products.get(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updated: Product = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      ),
      updatedAt: new Date(),
    };
    products.set(id, updated);
    return updated;
  },

  async delete(id) {
    products.delete(id);
  },

  async count(status, keyword) {
    let items = Array.from(products.values());
    if (status) {
      items = items.filter((p) => p.status === status);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          (p.description && p.description.toLowerCase().includes(kw))
      );
    }
    return items.length;
  },
};

// テスト用：商品ストアをリセット（サンプルデータを再投入）
export function resetProductStore(): void {
  products.clear();
  const allProducts = [...BASE_PRODUCTS, ...EXTENSION_PRODUCTS];
  allProducts.forEach((p) => products.set(p.id, { ...p }));
}
