using System;

namespace API.Entities;

public class UiSettings
{
    public int Id { get; set; }

    // Theme palette colors (hex). Allowed formats: #RRGGBB or #RRGGBBAA
    public string PrimaryColorLight { get; set; } = "#1565c0";
    public string SecondaryColorLight { get; set; } = "#ffb300";
    public string PrimaryColorDark { get; set; } = "#90caf9";
    public string SecondaryColorDark { get; set; } = "#ffcc80";

    // Allowed values: "primary", "secondary", "inherit", "text"
    public string ButtonIconColor { get; set; } = "primary";

    // Allowed values: MUI badge colors => default, primary, secondary, error, info, success, warning
    public string NotificationsBadgeColorLight { get; set; } = "warning";
    public string NotificationsBadgeColorDark { get; set; } = "secondary";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
