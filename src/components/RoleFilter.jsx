import React from "react";
import RoleIcon from "./RoleIcon";

const ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"];

const ROLE_KEYS = [
  "top",
  "jungle",
  "mid",
  "adc",
  "support"
];

export default function RoleFilter({
  activeRole,
  onToggleRole
}) {

  return (

    <div className="flex items-center gap-1">

      {ROLES.map((role, index) => {

        const roleKey = ROLE_KEYS[index];

        const isActive = activeRole === roleKey;

        return (

          <button
            key={roleKey}
            onClick={() => onToggleRole(roleKey)}
            title={`Filter by ${role}`}

            className={`
              w-8
              h-8
              flex items-center justify-center

              rounded-md

              transition-all duration-200 ease-out

              ${
                isActive
                  ? `
                    bg-white/10
                    shadow-inner
                    scale-105
                  `
                  : `
                    border border-white/10
                    hover:bg-white/10
                    hover:border-white/30
                    hover:scale-105
                  `
              }
            `}
          >

            <RoleIcon
              role={role}
              isFilter={true}
              className={`
                w-5 h-5
                object-contain
                transition-all duration-200

                ${
                  isActive
                    ? "brightness-150 opacity-100"
                    : "opacity-60 hover:opacity-100"
                }
              `}
            />

          </button>

        );

      })}

    </div>

  );

}