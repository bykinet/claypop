// src/game/targets/catalog.ts
// 데이터 기반의 확장 가능한 타겟 카탈로그 및 행동 정의 모듈

import { TargetType } from '../sim/types';

export type TrajectoryPattern =
  | 'parabola'
  | 'wavy_copter'
  | 'boomerang'
  | 'erratic_star'
  | 'flutter_chicken';

export type ProjectileType =
  | 'shotgun_pellet'
  | 'emp_spark'
  | 'energy_ring'
  | 'plasma_bolt'
  | 'seed_egg';

export interface TargetSkinVariant {
  version: number;
  name: { en: string; ko: string; ja: string };
  desc: { en: string; ko: string; ja: string };
  priceMileage: number;
  unlockedByDefault: boolean;
  image?: string;
}

export interface TargetDefinition {
  id: string;
  type: TargetType;
  name: { en: string; ko: string; ja: string };
  desc: { en: string; ko: string; ja: string };
  icon: string;
  baseScore: number;
  baseRadius: number;
  baseDuration: number;
  trajectory: TrajectoryPattern;
  projectile: ProjectileType;
  projectileColor: string;
  particleColor: number;
  soundType: 'clay' | 'copter' | 'boom' | 'ufo' | 'chick';
  variants: TargetSkinVariant[];
}

export const TARGET_CATALOG: Record<TargetType, TargetDefinition> = {
  clay: {
    id: 'clay_classic',
    type: 'clay',
    name: {
      en: 'Classic Clay Disc',
      ko: '클래이 원반 타겟',
      ja: 'クラシッククレイ',
    },
    desc: {
      en: 'Traditional parabolic clay target. Predict the arc and lead your shot.',
      ko: '포물선을 그리며 날아가는 정통 클레이 원반. 궤적 앞을 예측하여 사격하세요.',
      ja: '放物線を描いて飛ぶ定番のクレイ。軌道の先を狙い撃ちましょう。',
    },
    icon: '/brand/targets/clay.jpg',
    baseScore: 100,
    baseRadius: 4.5,
    baseDuration: 2.2,
    trajectory: 'parabola',
    projectile: 'shotgun_pellet',
    projectileColor: '#f59e0b',
    particleColor: 0xf56518,
    soundType: 'clay',
    variants: [
      {
        version: 1,
        name: { en: 'Classic Orange', ko: '클래식 오렌지', ja: 'クラシックオレンジ' },
        desc: { en: 'Fluorescent orange matte clay disc.', ko: '형광 주황색의 무광 점토 원반.', ja: '蛍光オレンジのマットな粘土円盤。' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
      {
        version: 2,
        name: { en: 'Neon Cyberpunk', ko: '네온 사이버펑크', ja: 'ネオンサイバー' },
        desc: { en: 'Black body with spinning pink & cyan neon LED edge.', ko: '네온 LED 불빛이 회전하는 미래형 원반.', ja: 'LEDライトが回転するサイバー円盤。' },
        priceMileage: 100,
        unlockedByDefault: false,
      },
      {
        version: 3,
        name: { en: 'Gold Coin', ko: '황금 코인', ja: 'ゴールドコイン' },
        desc: { en: 'Gleaming golden disc yielding extra mileage.', ko: '타격 시 보너스 마일리지를 주는 황금 유광 원반.', ja: '打撃時にボーナスマイルがもらえる金貨円盤。' },
        priceMileage: 250,
        unlockedByDefault: false,
      },
    ],
  },

  copter: {
    id: 'copter_drone',
    type: 'copter',
    name: {
      en: 'Disc Copter Target',
      ko: '원반 콥터 타겟',
      ja: 'コプターターゲット',
    },
    desc: {
      en: 'Moves in wavy vertical oscillations and flies in reverse direction.',
      ko: '가운데 프로펠러로 위아래 웨이브를 타며 반대 방향으로 비행합니다.',
      ja: '中央のプロペラで上下に波打ちながら逆方向に飛行します。',
    },
    icon: '/brand/targets/copter.jpg',
    baseScore: 130,
    baseRadius: 4.2,
    baseDuration: 2.2,
    trajectory: 'wavy_copter',
    projectile: 'emp_spark',
    projectileColor: '#38bdf8',
    particleColor: 0x38bdf8,
    soundType: 'copter',
    variants: [
      {
        version: 1,
        name: { en: 'Drone Copter', ko: '드론 스타일', ja: 'ドローンスタイル' },
        desc: { en: 'Modern white body with quad metallic propellers.', ko: '세련된 미니 드론 형태.', ja: '洗練されたミニドローン型。' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
      {
        version: 2,
        name: { en: 'Steampunk', ko: '스팀펑크', ja: 'スチームパンク' },
        desc: { en: 'Brass gears and vintage wooden propeller.', ko: '황동 태엽과 빈티지 나무 프로펠러.', ja: '真鍮の歯車とヴィンテージ木製プロペラ。' },
        priceMileage: 150,
        unlockedByDefault: false,
      },
      {
        version: 3,
        name: { en: 'Toy Helicopter', ko: '장난감 헬기', ja: 'おもちゃのヘリ' },
        desc: { en: 'Colorful retro plastic toy breaking into toy bricks.', ko: '맞추면 블록 파편이 튀는 레트로 장난감.', ja: '命中時にブロックが飛び散るレトロ玩具。' },
        priceMileage: 300,
        unlockedByDefault: false,
      },
    ],
  },

  boom: {
    id: 'boomerang_clay',
    type: 'boom',
    name: {
      en: 'Clay Boomerang',
      ko: '클래이 부매랑 타겟',
      ja: 'クレイブーメラン',
    },
    desc: {
      en: 'Flies outwards then curves back along its path. Bonus on return flight!',
      ko: '발사되어 날아갔다가 원래 방향으로 되돌아옵니다. 귀환 중에 맞히면 고득점!',
      ja: '発射された後、元の方向に折り返します。帰還中に当てると高得点！',
    },
    icon: '/brand/targets/boom.jpg',
    baseScore: 110,
    baseRadius: 4.0,
    baseDuration: 2.6,
    trajectory: 'boomerang',
    projectile: 'energy_ring',
    projectileColor: '#facc15',
    particleColor: 0xfacc15,
    soundType: 'boom',
    variants: [
      {
        version: 1,
        name: { en: 'Tribal Wood', ko: '트라이벌 우드', ja: 'トライバルウッド' },
        desc: { en: 'Ancient wood painted with fluorescent patterns.', ko: '원시 부족 문양의 형광 목재 부메랑.', ja: '蛍光模様が描かれた伝統的な木製ブーメラン。' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
      {
        version: 2,
        name: { en: 'Aerodynamic Metal', ko: '에어로다이내믹 메탈', ja: 'エアロメタル' },
        desc: { en: 'Sleek silver alloy leaving wind trails.', ko: '바람결 이펙트를 남기는 날렵한 알루미늄 부메랑.', ja: '風の軌跡を残すアルミ合金ブーメラン。' },
        priceMileage: 150,
        unlockedByDefault: false,
      },
      {
        version: 3,
        name: { en: 'Hologram Energy', ko: '홀로그램 에너지', ja: 'ホログラム' },
        desc: { en: 'Translucent digital energy shattering into pixels.', ko: '맞추면 디지털 픽셀로 분해되는 홀로그램.', ja: '命中時にピクセルに分解されるホログラム。' },
        priceMileage: 300,
        unlockedByDefault: false,
      },
    ],
  },

  ufo: {
    id: 'ufo_star',
    type: 'ufo',
    name: {
      en: 'Star-shaped UFO',
      ko: '별모양 UFO 타겟',
      ja: '星型UFO',
    },
    desc: {
      en: 'Spins rapidly with erratic trajectory turns and unexpected sudden drops.',
      ko: '빙글빙글 회전하며 여러 방향으로 꺾이다가 무작위로 하강합니다.',
      ja: '高速回転しながら予測不能に方向転換し、突然下降します。',
    },
    icon: '/brand/targets/ufo.jpg',
    baseScore: 160,
    baseRadius: 3.6,
    baseDuration: 2.6,
    trajectory: 'erratic_star',
    projectile: 'plasma_bolt',
    projectileColor: '#a855f7',
    particleColor: 0xa855f7,
    soundType: 'ufo',
    variants: [
      {
        version: 1,
        name: { en: 'Retro 8-bit Pixel', ko: '레트로 8비트', ja: 'レトロ8ビット' },
        desc: { en: 'Arcade style flat pixel star.', ko: '고전 아케이드 도트 스타일의 노란 별.', ja: 'クラシックなドット絵の黄色い星。' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
      {
        version: 2,
        name: { en: 'Crystal Star', ko: '크리스탈 스타', ja: 'クリスタルスター' },
        desc: { en: 'Faceted prismatic crystal scattering light reflections.', ko: '회전할 때마다 빛이 난반사되는 보석 별.', ja: '回転するたびに光が乱反射するクリスタル星。' },
        priceMileage: 200,
        unlockedByDefault: false,
      },
      {
        version: 3,
        name: { en: 'Alien Mothership', ko: '외계 비행선', ja: 'エイリアン母船' },
        desc: { en: 'Starcraft piloted by a cute mini slime alien in dome.', ko: '투명 돔 안에 슬라임 외계인이 탄 비행선.', ja: 'かわいいスライム宇宙人が乗った星型宇宙船。' },
        priceMileage: 350,
        unlockedByDefault: false,
      },
    ],
  },

  chick: {
    id: 'chick_panicked',
    type: 'chick',
    name: {
      en: 'Panicked Chicken',
      ko: '놀란 치킨 타겟',
      ja: 'パニックチキン',
    },
    desc: {
      en: 'Flaps wings excitedly and puffs feathers while flying in reverse.',
      ko: '발사되면 놀란 치킨이 날개를 파닥이고 깃털을 뿜으며 날아갑니다.',
      ja: '羽をバタつかせ、羽毛を散らしながらコミカルに飛んでいきます。',
    },
    icon: '/brand/targets/chick.jpg',
    baseScore: 150,
    baseRadius: 4.8,
    baseDuration: 2.2,
    trajectory: 'flutter_chicken',
    projectile: 'seed_egg',
    projectileColor: '#ef4444',
    particleColor: 0xf8fafc,
    soundType: 'chick',
    variants: [
      {
        version: 1,
        name: { en: 'Cartoon Toon', ko: '카툰 툰렌더', ja: 'カートゥーン' },
        desc: { en: 'Comical big-eyed white chicken.', ko: '동그란 눈과 과장된 부리의 익살스러운 닭.', ja: '目が丸く愛らしいコミカルな白チキン。' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
      {
        version: 2,
        name: { en: 'Mecha Chicken', ko: '메카 치킨', ja: 'メカチキン' },
        desc: { en: 'Clockwork tin robot chicken dropping gears and screws.', ko: '맞추면 나사와 톱니바퀴가 튀는 양철 로봇 닭.', ja: '歯車やネジを落とすゼンマイ式ブリキロボ。' },
        priceMileage: 200,
        unlockedByDefault: false,
      },
      {
        version: 3,
        name: { en: 'Screaming Rubber Chicken', ko: '비명 고무닭', ja: '叫ぶゴムチキン' },
        desc: { en: 'Iconic yellow squeaky toy chicken stretching and puffing.', ko: '맞추면 고무가 찢어지는 파편이 튀는 샛노란 고무닭.', ja: '撃つと愉快な破片が散る黄色いゴム製チキン。' },
        priceMileage: 350,
        unlockedByDefault: false,
      },
    ],
  },
  echo: {
    id: 'clay_echo',
    type: 'echo',
    name: {
      en: 'Echo Climax Disc',
      ko: '메아리 클라이맥스 원반',
      ja: 'エコー・クライマックス',
    },
    desc: {
      en: 'High-speed bonus clay launched during the echo window.',
      ko: '메아리 구간에 고속으로 사출되는 보너스 원반.',
      ja: 'エコー区間に高速射出されるボーナスクレイ。',
    },
    icon: '/brand/targets/clay.jpg',
    baseScore: 100,
    baseRadius: 4.5,
    baseDuration: 1.8,
    trajectory: 'parabola',
    projectile: 'shotgun_pellet',
    projectileColor: '#38bdf8',
    particleColor: 0x38bdf8,
    soundType: 'clay',
    variants: [
      {
        version: 1,
        name: { en: 'Echo Standard', ko: '메아리 기본', ja: 'エコースタンダード' },
        desc: { en: 'Luminescent blue clay', ko: '발광 블루 원반', ja: '発光ブルークレイ' },
        priceMileage: 0,
        unlockedByDefault: true,
      },
    ],
  },
};

/**
 * 모든 기본 타겟 타입 목록
 */
export const ALL_TARGET_TYPES: TargetType[] = ['clay', 'copter', 'boom', 'ufo', 'chick'];

/**
 * 특정 타겟 정의 가져오기
 */
export function getTargetDefinition(type: TargetType): TargetDefinition {
  return TARGET_CATALOG[type] ?? TARGET_CATALOG.clay;
}

/**
 * 타겟 타입 및 버전별 이미지 URL (폴더 우선)
 */
export function getTargetImageUrl(type: TargetType, version = 1): string {
  return `/brand/targets/${type}/v${version}.png`;
}

/**
 * 타겟 타입 및 버전별 폴백 이미지 URL (루트 플랫 파일명)
 */
export function getTargetFallbackImageUrl(type: TargetType, version = 1): string {
  return `/brand/targets/${type}_v${version}.png`;
}

/**
 * 발사체(탄환) 이미지 URL
 */
export function getProjectileImageUrl(type: ProjectileType): string {
  return `/brand/projectiles/${type}.png`;
}

/**
 * 테마별 배경 이미지 URL
 */
export function getThemeBackgroundUrl(type: TargetType): string {
  return `/brand/backgrounds/bg_${type}.png`;
}

/**
 * 테마별 배경 이미지 폴백 URL
 */
export function getThemeBackgroundFallbackUrl(type: TargetType): string {
  return `/brand/backgrounds/bg_${type}.jpg`;
}
