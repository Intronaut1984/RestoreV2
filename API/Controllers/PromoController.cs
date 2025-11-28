using System.Linq;
using API.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PromoController : ControllerBase
{
    [HttpGet]
    public ActionResult<PromoDto> Get([FromServices] API.Data.StoreContext context)
    {
        var promo = context.Promos.FirstOrDefault();
        if (promo == null)
        {
            return Ok(new PromoDto { Message = "Promoção: Entrega grátis em compras acima de €50 — Aproveite!", Color = "#050505" });
        }

        return Ok(new PromoDto { Message = promo.Message, Color = promo.Color });
    }
}
