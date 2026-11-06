/**
 * Prep column layout:
 * - Parent: fixed height (same as Main / Result cards)
 * - Block 1 (settings): height from content
 * - Block 2 (Export size + User prompt): scrolls if parent overflows;
 *   textarea has a floor, fills leftover space, then grows with content
 */
export const USER_PROMPT_TEXTAREA_ROWS = 6

/** Floor height for the longest Imagine Tattoo placeholders. */
export const USER_PROMPT_TEXTAREA_INPUT_CLASSNAME =
  'min-h-[9.9rem] w-full overflow-hidden resize-none'

/**
 * Parent - same size as upload / result cards.
 * overflow-visible so Block 1 InfoHints are not clipped; Block 2 scrolls itself.
 */
export const WORKSPACE_PREP_FRAME_CLASSNAME =
  'relative flex aspect-[4/5] w-full min-w-0 flex-col overflow-visible rounded-[26px] border border-dashed border-white/15 bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:aspect-[5/6] lg:aspect-[4/5]'

export const WORKSPACE_PREP_BODY_CLASSNAME =
  'flex h-full min-h-0 flex-col gap-4 p-4 sm:p-5'

/** Block 1 - mode settings / uploads; height from content. */
export const WORKSPACE_PREP_SETTINGS_CLASSNAME =
  'relative z-10 min-w-0 shrink-0 overflow-visible'

/** Block 2 - Export size + User prompt; scrolls when taller than parent. */
export const WORKSPACE_PREP_OPTIONS_CLASSNAME =
  'flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto'

/**
 * Content-sized prompt (height comes from textarea JS).
 * Textarea fills Block 2 budget, then grows with content so Block 2 scrolls.
 */
export const USER_PROMPT_EDITOR_CLASSNAME = 'flex flex-col'

export const USER_PROMPT_INPUT_GROUP_CLASSNAME = 'flex flex-col'

/** Stable scrollport for fill-height measurement (avoids infinite grow loops). */
export const WORKSPACE_PREP_OPTIONS_ATTR = 'data-prep-options'

export const WORKSPACE_PREP_PROMPT_ATTR = 'data-prep-prompt'
