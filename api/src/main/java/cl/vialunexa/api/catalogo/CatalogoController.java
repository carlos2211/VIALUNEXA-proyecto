package cl.vialunexa.api.catalogo;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints base de la API de VIALUNEXA.
 *
 * Por ahora entrega datos de catálogo fijos (los mismos del prototipo). En las
 * semanas 5 a 7 se reemplazarán por consultas a Oracle Database en Oracle Cloud
 * (tablas TARIFA y TIPO_SERVICIO del modelo de datos).
 */
@RestController
public class CatalogoController {

    public record Tarifa(String modalidad, String nombre, int tarifaBase, int valorKm, int valorHoraEspera) {}

    public record TipoServicio(int id, String nombre, String icono) {}

    public record Version(String servicio, String commit, Instant inicio) {}

    private static final List<Tarifa> TARIFAS = List.of(
        new Tarifa("vehiculo", "Viaje con conductor", 10_000, 750, 6_000),
        new Tarifa("conductor", "Chofer para mi auto", 15_000, 500, 6_000)
    );

    private static final List<TipoServicio> SERVICIOS = List.of(
        new TipoServicio(1, "Horas médicas", "🩺"),
        new TipoServicio(2, "Centros médicos", "🏥"),
        new TipoServicio(3, "Matrimonios", "💍"),
        new TipoServicio(4, "Fiestas y eventos", "🎉"),
        new TipoServicio(5, "Graduaciones", "🎓"),
        new TipoServicio(6, "Bautizos", "🍼"),
        new TipoServicio(7, "Aeropuerto", "✈️"),
        new TipoServicio(8, "Viajes ejecutivos", "💼"),
        new TipoServicio(9, "Adultos mayores", "👴"),
        new TipoServicio(10, "Conductor privado", "🚘"),
        new TipoServicio(11, "Trámites y diligencias", "🗓️"),
        new TipoServicio(12, "Otro servicio", "✨")
    );

    private final String commit;
    private final Instant inicio = Instant.now();

    public CatalogoController(@Value("${app.commit:local}") String commit) {
        this.commit = commit;
    }

    /** Portada: qué servicio es y qué endpoints ofrece */
    @GetMapping("/")
    public Map<String, Object> inicio() {
        return Map.of(
            "servicio", "vialunexa-api",
            "estado", "en línea",
            "endpoints", List.of("/api/version", "/api/tarifas", "/api/servicios", "/actuator/health")
        );
    }

    /** Commit desplegado e instante de inicio: permite ver qué versión está publicada */
    @GetMapping("/api/version")
    public Version version() {
        return new Version("vialunexa-api", commit, inicio);
    }

    @GetMapping("/api/tarifas")
    public List<Tarifa> tarifas() {
        return TARIFAS;
    }

    @GetMapping("/api/servicios")
    public List<TipoServicio> servicios() {
        return SERVICIOS;
    }
}
