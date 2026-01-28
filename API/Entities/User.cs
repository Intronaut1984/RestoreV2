using System;
using Microsoft.AspNetCore.Identity;

namespace API.Entities;

public class User : IdentityUser
{
    public int? AddressId { get; set; }
    public Address? Address { get; set; }

    // Marketing/newsletter emails. Default true for existing users to preserve expected behavior.
    public bool NewsletterOptIn { get; set; } = true;
}
