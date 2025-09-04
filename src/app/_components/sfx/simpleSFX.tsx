import { parseSFXFields } from "@/utils/parse/sfxParse";
import type { LangObject } from "@/utils/utils";
import type { SFXTLDiscriminator } from "./utils";

export const SimpleSFXCard = async ({
  sfx,
  size,
}: SFXTLDiscriminator & {
  langs?: LangObject[];
  tlExtra?: string;
  size: { width: number; height: number };
}) => {
  const titleId = `sfx_${sfx.id}_title`;

  const parsed = parseSFXFields(sfx);

  return (
    <div
      style={{
        display: "flex",
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: "#1e293b",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          borderRadius: "8px",
          border: "1px dashed #1d4ed8",
          borderStyle: "dashed",
          minWidth: "80%",
          backgroundColor: "#374151",
          padding: "12px 16px",
          boxShadow: "0 1px 2px 0 #1e3a8a",
        }}
        aria-labelledby={titleId}
        aria-label="SFX entry"
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "center",
              paddingRight: "8px",
              fontSize: "30px",
              fontWeight: 900,
              color: "#e0e7ff",
              fontFamily: `ui-sans-serif, system-ui, sans-serif`,
            }}
            id={titleId}
          >
            {sfx.text}
          </div>

          {parsed.read && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                whiteSpace: "pre-wrap",
                color: "#60a5fa",
                marginLeft: "15px",
              }}
            >
              {parsed.read
                .filter((q) => q.type === "string")
                .map((z) => (
                  <div
                    key={z.index}
                    style={{ display: "flex", fontSize: "14px" }}
                  >
                    {z.value}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "25px",
          }}
          aria-labelledby={titleId}
          aria-label="SFX details"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              whiteSpace: "pre-wrap",
              color: "#93c5fd",
            }}
          >
            {parsed.def
              ?.filter((q) => q.type === "string")
              .map((q) => (
                <div key={`def_${q.index}`} style={{ display: "flex" }}>
                  {q.value}
                </div>
              ))}
          </div>
          <div
            style={{
              display: "flex",
              paddingLeft: "35px",
              fontSize: "14px",
              whiteSpace: "pre-wrap",
              color: "#3b82f6",
            }}
          >
            {parsed.extra
              ?.filter((q) => q.type === "string")
              .map((q) => (
                <div key={`def_${q.index}`} style={{ display: "flex" }}>
                  {q.value}
                </div>
              ))}
          </div>
        </div>

        {/* {sfx.tls.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px",
              }}
              aria-labelledby={titleId}
              aria-label="SFX translation list"
            >
              {sfx.tls.map((tl) => {
                return (
                  <SimpleSFXCard
                    key={`tl_${tl.sfx.id}`}
                    sfx={tl.sfx}
                    langs={langs}
                  />
                );
              })}
            </div>
          </>
        )} */}
      </div>
    </div>
  );
};
