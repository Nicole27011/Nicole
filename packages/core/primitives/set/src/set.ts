const SET_ID = Symbol('SET_ID');

/**
 * A simplified alternate implementation of a Set implemented with a single
 * Array. It's expensive to allocate objects on the hot path, and Sets are much
 * slower to create and use than Arrays. To work with a single array, LiteSet
 * stashes information on hidden props on the array items themselves.
 *
 * Use the functions below to manipulate the set. Read from the set with
 * standard indexing syntax.
 */
export interface LiteSet<T extends Object, METADATA = {}> extends Array<T & METADATA> {
  /**
   * A hidden identifier for this instance of the set. Used to key the
   * information stored on the set's items.
   */
  [SET_ID]: number;
}

interface LiteSetItem {
  /**
   * Key where we store the index the item is at on a given set.
   * Example: {'__idx_for_set_3': 1} Stored in set with ID 3 in 1th position.
   */
  [index: `__idx_for_set_${number}`]: number | undefined;
}

let nextSetId = 0;

/** Create an instance of a LiteSet. */
export function createLiteSet<T extends Object, METADATA>(): LiteSet<T, METADATA> {
  const set = [] as unknown as LiteSet<T, METADATA>;
  set[SET_ID] = nextSetId++;
  return set;
}

function indexOf<T extends Object, METADATA>(
  set: LiteSet<T, METADATA>,
  item: T,
): number | undefined {
  return (item as unknown as LiteSetItem)[`__idx_for_set_${set[SET_ID]}`];
}

/** Add an item to the LiteSet. No-op if the item is already in the set. */
export function addToLiteSet<T extends Object, METADATA>(set: LiteSet<T, METADATA>, item: T): void {
  if (indexOf(set, item) === undefined) {
    const index = set.push(item as T & METADATA) - 1;
    (item as unknown as LiteSetItem)[`__idx_for_set_${set[SET_ID]}`] = index;
  }
}

/** Remove an item to the LiteSet. No-op if the item isn't in the set. */
export function removeFromLiteSet<T extends Object, METADATA>(
  set: LiteSet<T, METADATA>,
  item: T,
): void {
  const index = indexOf(set, item);
  if (index === undefined) return;

  // Cleanup the stored index on the item.
  delete (set[index] as LiteSetItem)[`__idx_for_set_${set[SET_ID]}`];

  if (set.length > 1) {
    // Swap the last item into the deleted position
    const lastIndex = set.length - 1;
    set[index] = set[lastIndex];
    (set[index] as LiteSetItem)[`__idx_for_set_${set[SET_ID]}`] = index;
  }

  // Truncate the array
  set.length--;
}