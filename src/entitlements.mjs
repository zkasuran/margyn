/**
 * What a purchase unlocks, in one place.
 *
 * Two servers mint licences (the Worker and the local Node server) and the CLI
 * asks one question of the result: does this licence cover `watch`. If the two
 * servers each carried their own copy of the mapping, a Team customer could get a
 * licence from one host that unlocks the paid check and a licence from the other
 * that does not. So the mapping lives here and both import it.
 *
 * Team is Watch for a whole organisation, so it has to grant the same capability
 * or somebody who bought the larger plan would find the paid check locked. Fix
 * flow is a service and unlocks nothing in the binary, which a licence should say
 * rather than imply.
 */
export const GRANTS = {
  watch: ["watch"],
  team: ["team", "watch"],
  fixflow: ["fixflow"],
};

/**
 * Expands the product keys an account owns into the capabilities its licence
 * should carry. An unknown key maps to itself rather than being dropped, so a
 * product created before this build knows about it still produces a licence
 * naming what was bought.
 *
 * @param keys product keys, for example ["team"]
 * @returns capability names, deduplicated
 */
export function granted(keys) {
  return [...new Set(keys.flatMap((key) => GRANTS[key] ?? [key]))];
}
