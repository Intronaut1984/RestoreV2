using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.Data;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace API.Controllers;

public class UiSettingsController(StoreContext context) : BaseApiController
{
    private static readonly Regex HexColorRegex = new("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", RegexOptions.Compiled);

    private static string NormalizeHexOrDefault(string? value, string fallback)
    {
        var v = (value ?? string.Empty).Trim();
        return HexColorRegex.IsMatch(v) ? v : fallback;
    }

    private static readonly HashSet<string> AllowedButtonIconColors = new(StringComparer.OrdinalIgnoreCase)
    {
        "primary",
        "secondary",
        "inherit",
        "text"
    };

    private static readonly HashSet<string> AllowedBadgeColors = new(StringComparer.OrdinalIgnoreCase)
    {
        "default",
        "primary",
        "secondary",
        "error",
        "info",
        "success",
        "warning"
    };

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<UiSettingsDto>> GetUiSettings()
    {
        var settings = await context.UiSettings.AsNoTracking().FirstOrDefaultAsync();

        if (settings == null)
        {
            return Ok(new UiSettingsDto
            {
                PrimaryColorLight = "#1565c0",
                SecondaryColorLight = "#ffb300",
                PrimaryColorDark = "#90caf9",
                SecondaryColorDark = "#ffcc80",
                ButtonIconColor = "primary",
                NotificationsBadgeColorLight = "warning",
                NotificationsBadgeColorDark = "secondary"
            });
        }

        return Ok(new UiSettingsDto
        {
            PrimaryColorLight = NormalizeHexOrDefault(settings.PrimaryColorLight, "#1565c0"),
            SecondaryColorLight = NormalizeHexOrDefault(settings.SecondaryColorLight, "#ffb300"),
            PrimaryColorDark = NormalizeHexOrDefault(settings.PrimaryColorDark, "#90caf9"),
            SecondaryColorDark = NormalizeHexOrDefault(settings.SecondaryColorDark, "#ffcc80"),
            ButtonIconColor = settings.ButtonIconColor,
            NotificationsBadgeColorLight = settings.NotificationsBadgeColorLight,
            NotificationsBadgeColorDark = settings.NotificationsBadgeColorDark
        });
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> UpdateUiSettings([FromBody] UpdateUiSettingsDto dto)
    {
        if (dto == null) return BadRequest("Invalid payload");

        var primaryLight = (dto.PrimaryColorLight ?? string.Empty).Trim();
        var secondaryLight = (dto.SecondaryColorLight ?? string.Empty).Trim();
        var primaryDark = (dto.PrimaryColorDark ?? string.Empty).Trim();
        var secondaryDark = (dto.SecondaryColorDark ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(primaryLight)) return BadRequest("PrimaryColorLight is required");
        if (string.IsNullOrWhiteSpace(secondaryLight)) return BadRequest("SecondaryColorLight is required");
        if (string.IsNullOrWhiteSpace(primaryDark)) return BadRequest("PrimaryColorDark is required");
        if (string.IsNullOrWhiteSpace(secondaryDark)) return BadRequest("SecondaryColorDark is required");

        if (!HexColorRegex.IsMatch(primaryLight)) return BadRequest("PrimaryColorLight must be a hex color like #RRGGBB or #RRGGBBAA");
        if (!HexColorRegex.IsMatch(secondaryLight)) return BadRequest("SecondaryColorLight must be a hex color like #RRGGBB or #RRGGBBAA");
        if (!HexColorRegex.IsMatch(primaryDark)) return BadRequest("PrimaryColorDark must be a hex color like #RRGGBB or #RRGGBBAA");
        if (!HexColorRegex.IsMatch(secondaryDark)) return BadRequest("SecondaryColorDark must be a hex color like #RRGGBB or #RRGGBBAA");

        var value = (dto.ButtonIconColor ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value)) return BadRequest("ButtonIconColor is required");
        if (!AllowedButtonIconColors.Contains(value))
            return BadRequest("ButtonIconColor must be one of: primary, secondary, inherit, text");

        var badgeLight = (dto.NotificationsBadgeColorLight ?? string.Empty).Trim();
        var badgeDark = (dto.NotificationsBadgeColorDark ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(badgeLight)) return BadRequest("NotificationsBadgeColorLight is required");
        if (string.IsNullOrWhiteSpace(badgeDark)) return BadRequest("NotificationsBadgeColorDark is required");
        if (!AllowedBadgeColors.Contains(badgeLight))
            return BadRequest("NotificationsBadgeColorLight must be one of: default, primary, secondary, error, info, success, warning");
        if (!AllowedBadgeColors.Contains(badgeDark))
            return BadRequest("NotificationsBadgeColorDark must be one of: default, primary, secondary, error, info, success, warning");

        var settings = await context.UiSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new UiSettings
            {
                PrimaryColorLight = primaryLight,
                SecondaryColorLight = secondaryLight,
                PrimaryColorDark = primaryDark,
                SecondaryColorDark = secondaryDark,
                ButtonIconColor = value.ToLowerInvariant(),
                NotificationsBadgeColorLight = badgeLight.ToLowerInvariant(),
                NotificationsBadgeColorDark = badgeDark.ToLowerInvariant(),
                UpdatedAt = DateTime.UtcNow
            };
            context.UiSettings.Add(settings);
        }
        else
        {
            settings.PrimaryColorLight = primaryLight;
            settings.SecondaryColorLight = secondaryLight;
            settings.PrimaryColorDark = primaryDark;
            settings.SecondaryColorDark = secondaryDark;
            settings.ButtonIconColor = value.ToLowerInvariant();
            settings.NotificationsBadgeColorLight = badgeLight.ToLowerInvariant();
            settings.NotificationsBadgeColorDark = badgeDark.ToLowerInvariant();
            settings.UpdatedAt = DateTime.UtcNow;
        }

        await context.SaveChangesAsync();
        return NoContent();
    }
}
