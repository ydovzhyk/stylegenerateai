/**
 * Prep column layout:
 * - Mobile: natural height, full prompt visible, no inner scroll
 * - md+: fixed aspect (same as Main / Result cards)
 *   - Block 1 (settings): height from content
 *   - Block 2 (Export size + User prompt): scrolls if parent overflows;
 *     textarea has a floor, fills leftover space, then grows with content
 */
export const USER_PROMPT_TEXTAREA_ROWS = 6

/** Floor height for the longest Imagine Tattoo placeholders. */
export const USER_PROMPT_TEXTAREA_INPUT_CLASSNAME =
  'min-h-[9.9rem] w-full overflow-hidden resize-none'

/**
 * Parent - same size as upload / result cards from md up.
 * Mobile grows with content so Export size + prompt stay fully visible.
 * overflow-visible so Block 1 InfoHints are not clipped; Block 2 scrolls on md+.
 */
export const WORKSPACE_PREP_FRAME_CLASSNAME =
  'relative flex w-full min-w-0 flex-col overflow-visible rounded-[26px] border border-dashed border-white/15 bg-background-soft/70 shadow-[0_18px_60px_rgba(0,0,0,0.22)] aspect-auto md:aspect-[5/6] lg:aspect-[4/5]'

export const WORKSPACE_PREP_BODY_CLASSNAME =
  'flex flex-col gap-4 p-4 sm:p-5 md:h-full md:min-h-0'

/** Block 1 - mode settings / uploads; height from content. */
export const WORKSPACE_PREP_SETTINGS_CLASSNAME =
  'relative z-10 min-w-0 shrink-0 overflow-visible'

/**
 * Block 2 - Export size + User prompt.
 * Mobile: full height, no inner scroll. md+: flex fill + scroll when needed.
 */
export const WORKSPACE_PREP_OPTIONS_CLASSNAME =
  'flex flex-col gap-4 overflow-x-hidden overflow-y-visible md:min-h-0 md:flex-1 md:overflow-y-auto'

/**
 * Content-sized prompt (height comes from textarea JS).
 * md+: textarea fills Block 2 budget, then grows with content so Block 2 scrolls.
 */
export const USER_PROMPT_EDITOR_CLASSNAME = 'flex flex-col'

export const USER_PROMPT_INPUT_GROUP_CLASSNAME = 'flex flex-col'

/** Stable scrollport for fill-height measurement (avoids infinite grow loops). */
export const WORKSPACE_PREP_OPTIONS_ATTR = 'data-prep-options'

export const WORKSPACE_PREP_PROMPT_ATTR = 'data-prep-prompt'

/** fillHeight / locked prep card only from this breakpoint (Tailwind md). */
export const USER_PROMPT_FILL_HEIGHT_MQ = '(min-width: 768px)'
