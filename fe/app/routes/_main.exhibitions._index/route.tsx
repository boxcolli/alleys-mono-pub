import classes from "./styles.module.css"

import { $PATH, $POLICY, $STORAGE, $URL } from "~/config"
import { useFetcher, useSearchParams } from "@remix-run/react"
import { Display } from "./display"
import { useCallback, useEffect, useRef } from "react"
import { Pagination } from "./pagination"
import { usePersistedState } from "~/client/use-persisted-state"
import { useDebounce, useIsMount } from "~/client"
import config, { Option, Preset } from "./config"
import { loader } from "./loader"

export { loader }

export default function Index() {
  const isMount = useIsMount()
  const loadData = useDebounce(
    useFetcher({ key: config.key.dataFetcher }).load,
    300,
  )
  const loadCount = useDebounce(
    useFetcher({ key: config.key.countFetcher }).load,
    300,
  )

  /**
   * option:
   *  copy entries from searchParams
   */
  const [searchParams, setSearchParams] = useSearchParams()
  const [parsedPreset, parsedOption] = parseSearchParams(searchParams)
  const [preset, setPreset] = usePersistedState<Preset>(
    parsedPreset,
    $STORAGE.exhibition.preset.key,
  )
  const [option, setOption] = usePersistedState<Option>(
    parsedOption,
    $STORAGE.exhibition.option.key,
    { use: "sessionStorage" },
  )

  /**
   * page, count:
   *  sync with storage
   *  no URL sync
   */
  const [page, setPage] = usePersistedState(
    1,
    $STORAGE.exhibition.page.key,
    { use: "sessionStorage" },
  )
  
  /**
   * Event: on mount & option update
   * Action: update URL & request data
   */
  useEffect(() => {
    const sp = new URLSearchParams()

    // Load preset
    sp.set(config.preset.name, preset)

    // Load options
    config.loadSearchParams(sp, option)

    // Update URL
    setSearchParams(sp, { replace: true, preventScrollReset: true })
    sp.delete(config.preset.name)

    // Load preset constants & page
    config.loadSearchParams(sp, config.getConstants(preset))
    config.loadSearchParams(sp, { page })

    // Load data
    loadData(`${$PATH.api.exhibitions.index}?${sp.toString()}`)
    
    // Load count
    config.loadSearchParams(sp, { is_count: true })
    loadCount(`${$PATH.api.exhibitions.index}?${sp.toString()}`)
  }, [preset, option])

  /**
   * Event: page change
   * Action: load data
   * 
   *  To prevent calling loadCount twice, don't change params,
   *  because loadCount is being called at page mount.
   *  Instead manually request data.
   */
  useEffect(() => {
    if (isMount) { return }

    const sp = new URLSearchParams()

    // Load params
    config.loadSearchParams(sp, option)
    config.loadSearchParams(sp, config.getConstants(preset))
    config.loadSearchParams(sp, { page })
    
    loadData(`${$PATH.api.exhibitions.index}?${sp.toString()}`)
  }, [page])

  /**
   * Determine whether the filter is visible or not
   */
  // const isFilterVisible = useCallback(
  //   (name: string) => {
  //     switch (option.preset) {
  //       case config.presetNames.past:
  //         return name in config.pastFilterNames
  //       case config.presetNames.current:
  //         return name in config.currentFilterNames
  //       case config.presetNames.future:
  //         return name in config.futureFilterNames
  //       default:
  //         return false
  //     }
  //   },
  //   [option],
  // )

  // change preset
  function _handlePresetChange(preset: Preset) {
    setPreset(preset)
    setPage(1)
  }
  const handlePresetChange = useCallback(_handlePresetChange, [preset, page])

  // change option & page
  function _handleOptionChange<T extends keyof Option>(name: T, value: Option[T]) {
    setOption(prev => {
      const next = { ...prev }
      next[name] = value
      return next
    })
    setPage(1)
  }
  const handleOptionChange = useCallback(_handleOptionChange, [option, page])

  /**
   * Location filter helper
   */
  const locationSearchRef = useRef<HTMLInputElement | null>(null)
  const handleLocationSearchClick = () => {
    if (locationSearchRef.current) {
      locationSearchRef.current.select()
    }
  }

  return (
    <div className="padding">
      <h2>전시</h2>

      <section>
        <article>
          <nav className="no-space">
            <PresetButton preset={config.preset.names.past} label="지난 전시" state={preset} round="left" onClick={_ => handlePresetChange(config.preset.names.past)} />
            <PresetButton preset={config.preset.names.current} label="현재 전시" state={preset} round="no" onClick={_ => handlePresetChange(config.preset.names.current)} />
            <PresetButton preset={config.preset.names.future} label="예정 전시" state={preset} round="right" onClick={_ => handlePresetChange(config.preset.names.future)} />
          </nav>

          <fieldset>
            <legend>상세 검색</legend>

            <table className={classes["field-layout"]}>
              <tbody>
                {/* Price */}
                <SelectOption isVisible={true}>
                  <tr>
                    <td className="min">
                      <button className="chip">
                        <i>payments</i><span>관람료</span>
                      </button>
                    </td>
                    <td className="row">
                      <div className="field small border label max">
                        <input
                          className="responsive"
                          id="price-min" type="number" step={1000} min={0} defaultValue={option.price_min}
                          onChange={e => handleOptionChange(config.option.names.price_min, Number(e.currentTarget.value))}
                          placeholder=" "
                        />
                        <label htmlFor="price-min">
                          <span>최소</span>
                        </label>
                      </div>
                      <p>~</p>
                      <div className="field small border label max">
                        <input id="price-max" type="number" step={1000} min={0} defaultValue={option.price_max}
                          onChange={e => handleOptionChange(config.option.names.price_max, Number(e.currentTarget.value))}
                          placeholder=" "
                        />
                        <label htmlFor="price-max">최대</label>
                      </div>
                    </td>
                  </tr>
                  
                </SelectOption>

                {/* Location ids */}
                <SelectOption isVisible={false}>
                  <tr>
                    <td className="min">
                      <button className="chip">
                        <i>flag</i>
                        <span>장소</span>
                      </button>
                    </td>
                    <td>
                      <div className="row">
                        <button className="surface-container-highest small-round" onClick={handleLocationSearchClick}>
                          <i className="front">search</i>
                          <span>장소 검색</span>
                          <menu className="no-wrap right min small-round">
                            <div className="field no-margin fixed">
                              <input ref={locationSearchRef} />
                            </div>
                            <a className="row">
                              <i>add_location</i>
                              <div>Item 1</div>
                            </a>
                            <a className="row">
                              <i>add_location</i>
                              <div>Item 2</div>
                            </a>
                            <a className="row">
                              <i>add_location</i>
                              <div>Item 3</div>
                            </a>
                          </menu>
                        </button>
                      </div>
                    </td>
                  </tr>
                </SelectOption>
              </tbody>
            </table>
          </fieldset>
        </article>
      </section>
      
      <section>
        <article>
          <Display />
        </article>
      </section>

      <section>
        <article className="center-align">
          <Pagination page={page} setPage={setPage} />
        </article>
      </section>
    </div>
  )
}

function PresetButton({ preset, label, state, round, onClick }: {
  preset: string,
  label: string,
  state: Preset,
  round: "left" | "no" | "right",
  onClick: (preset: string) => any,
}) {
  const active = state === preset

  return (
    <button
      className={`border no-round small ${round + "-round"} ${active ? "fill" : ""}`}
      onClick={_ => onClick(preset)}
    >
      {active ? <strong>{label}</strong> : label}
    </button>
  )
}

function SelectOption({ isVisible, children }: {
  isVisible: boolean,
  children: React.ReactNode,
}) {
  return (
    <>{isVisible ? children : null}</>
  )
}

function parseSearchParams(sp: URLSearchParams): [Preset, Option] {
  let preset: Preset
  {
    const raw = sp.get(config.preset.name)
    if (raw == null) {
      preset = config.preset.names.current
    } else {
      if (raw in config.preset.names == false) {
        preset = config.preset.names.current
      } else {
        preset = raw as Preset
      }
    }
  }

  let option: Option
  {
    const obj = Object.fromEntries(sp.entries())
    const parsed = config.option.schema.safeParse(obj)
    if (parsed.error) {
      option = {}
    } else {
      option = parsed.data
    }
  }

  return [preset, option]
}
