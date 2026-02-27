namespace API.DTOs;

public class UiSettingsDto
{
    public string PrimaryColorLight { get; set; } = "#1565c0";
    public string SecondaryColorLight { get; set; } = "#ffb300";
    public string PrimaryColorDark { get; set; } = "#90caf9";
    public string SecondaryColorDark { get; set; } = "#ffcc80";

    public string ButtonIconColor { get; set; } = "primary";

    public string NotificationsBadgeColorLight { get; set; } = "warning";
    public string NotificationsBadgeColorDark { get; set; } = "secondary";
}
