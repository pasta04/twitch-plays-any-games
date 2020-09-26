import ref from 'ref-napi';
import ffiNapi from 'ffi-napi';
import StructType from 'ref-struct-napi';
import UnionType from 'ref-union-napi';
import ArrayType from 'ref-array-napi';

/*
SendInput function
  https://msdn.microsoft.com/library/windows/desktop/ms646310.aspx
*/
// check pointer size for defined ULONG_PTR
const ptrSize = ref.NULL_POINTER.length;

const ulongPtr = (function () {
  switch (ptrSize) {
    case 4:
      return ref.types.uint32;
    case 8:
      return ref.types.uint64;
    default:
      throw new Error(`Supported pointer size is 4 or 8, but is ${ptrSize}`);
  }
})();

const MouseInputType = StructType({
  dx: ref.types.long,
  dy: ref.types.long,
  mouseData: ref.types.uint32,
  dwFlags: ref.types.uint32,
  time: ref.types.uint32,
  dwExtraInfo: ulongPtr,
});

const KeybdInputType = StructType({
  wVk: ref.types.uint16,
  wScan: ref.types.uint16,
  dwFlags: ref.types.uint32,
  time: ref.types.uint32,
  dwExtraInfo: ulongPtr,
});

const HardwareInputType = StructType({
  uMsg: ref.types.uint32,
  wParamL: ref.types.uint16,
  wParamH: ref.types.uint16,
});

const UnionInputType = UnionType({
  mi: MouseInputType,
  ki: KeybdInputType,
  hi: HardwareInputType,
});

const InputType = StructType({
  type: ref.types.uint32,
  u: UnionInputType,
});

const InputArrayType = ArrayType(InputType);

const user32 = ffiNapi.Library('user32', {
  SendInput: [ref.types.uint, [ref.types.uint, InputArrayType, ref.types.int]],
  MapVirtualKeyA: [ref.types.uint, [ref.types.uint, ref.types.uint]],
});

// Virtual-Key Codes
//   https://msdn.microsoft.com/library/windows/desktop/dd375731.aspx
async function startInputKey(char: string, pressTime: number) {
  console.log('[startInputKey]');

  const charToKeyMap: {
    [char: string]: number;
  } = {
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    '←': 37,
    '↑': 38,
    '→': 39,
    '↓': 40,
  };

  // inputイベント種別
  const INPUT_MOUSE = 0;
  const INPUT_KEYBOARD = 1;
  const INPUT_HARDWARE = 2;

  /** キーを押す */
  const KEYEVENTF_KEYDOWN = 0x0;
  /** キーを離す */
  const KEYEVENTF_KEYUP = 0x2;
  /** 拡張コード */
  const KEYEVENTF_EXTENDEDKEY = 0x1;
  const VK_SHIFT = 0x10;

  const keys = char.split('').map((v) => charToKeyMap[v]);
  // const keys: number[] = [];
  // for (let i = 71; i < 83; i++) {
  //   // if (i >= 47 && i <= 57) continue;
  //   keys.push(i);
  // }

  const inputs = new InputArrayType(keys.length);

  try {
    let j;
    // 押す
    for (let i = (j = 0), len = keys.length; j < len; i = ++j) {
      const vk = keys[i];
      (inputs[i] as any).type = INPUT_KEYBOARD; // inputイベント種別
      (inputs[i] as any).u.ki.wVk = vk; // 押すキーの種別
      const scanCode = user32.MapVirtualKeyA(vk, 0);
      (inputs[i] as any).u.ki.wScan = user32.MapVirtualKeyA((inputs[i] as any).u.ki.wVk, 0); // DirectInputを介してキーボード入力をフェッチしてるやつには必要
      (inputs[i] as any).u.ki.dwFlags = vk >= 37 && vk <= 40 ? KEYEVENTF_KEYDOWN + KEYEVENTF_EXTENDEDKEY : KEYEVENTF_KEYDOWN;
      (inputs[i] as any).u.ki.time = 0;
      (inputs[i] as any).u.ki.dw = 0;
      // user32.SendInput(1, [inputs[i]], InputType.size);
      console.log(`vk: ${vk} scan: ${scanCode}`);
      // await sleep(500);
    }
    user32.SendInput(inputs.length, inputs, InputType.size);

    // 規定ms押してることにする
    await sleep(pressTime);

    // 離す
    for (let i = (j = 0), len = keys.length; j < len; i = ++j) {
      const vk = keys[i];
      (inputs[i] as any).type = INPUT_KEYBOARD; // inputイベント種別
      (inputs[i] as any).u.ki.wVk = vk; // 押すキーの種別
      (inputs[i] as any).u.ki.wScan = user32.MapVirtualKeyA((inputs[i] as any).u.ki.wVk, 0); // DirectInputを介してキーボード入力をフェッチしてるやつには必要
      (inputs[i] as any).u.ki.dwFlags = vk >= 37 && vk <= 40 ? KEYEVENTF_KEYUP + KEYEVENTF_EXTENDEDKEY : KEYEVENTF_KEYUP;
      (inputs[i] as any).u.ki.time = 0;
      (inputs[i] as any).u.ki.dw = 0;
    }
    user32.SendInput(inputs.length, inputs, InputType.size);

    console.log(`send: [key] ${char} [code] ${keys.join(',')}`);
  } catch (e) {
    console.error(e);
  }
}
const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

export default startInputKey;
