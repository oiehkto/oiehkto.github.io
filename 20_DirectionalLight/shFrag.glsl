#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 fragPos;  
in vec3 normal;  
in vec3 color;
in vec2 texCoord;

struct Material {
    sampler2D diffuse; // diffuse map
    vec3 specular;     // 표면의 specular color
    float shininess;   // specular 반짝임 정도
};

struct Light {
    //vec3 position;
    vec3 direction;
    vec3 ambient; // ambient 적용 strength
    vec3 diffuse; // diffuse 적용 strength
    vec3 specular; // specular 적용 strength
};

uniform Material material;
uniform Light light;
uniform vec3 u_viewPos;
uniform float toonLevel;
uniform bool texMode;
uniform int toonMode;

#define Q(a) ((round((a) * toonLevel - 0.5) + 0.5) / toonLevel)
#define Q_vec3(a) (normalize(a) * Q(sqrt(dot(a,a) / 3.0)) * sqrt(3.0))

void main() {
    vec3 rgb = texMode ? texture(material.diffuse, texCoord).rgb : color;

    // ambient
    vec3 ambient = light.ambient * rgb;
  	
    // diffuse 
    vec3 norm = normalize(normal);
    vec3 lightDir = normalize(light.direction);
    float dotNormLight = dot(norm, lightDir);
    float diff = max(dotNormLight, 0.0);
    vec3 use = light.diffuse * rgb;
    vec3 diffuse = light.diffuse * rgb * diff;
    
    // specular
    vec3 viewDir = normalize(u_viewPos - fragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float dotViewDirReflectDir = dot(viewDir, reflectDir);
    float spec = 0.0;
    if (dotNormLight > 0.0) { spec = pow(max(dotViewDirReflectDir, 0.0), material.shininess); }
    vec3 ular = light.specular * material.specular;
    vec3 specular = light.specular * material.specular * spec;

    // result
    vec3 result;
    if(toonMode == 0) {
        result = ambient + Q(diff)*use + Q(spec)*ular;
    }
    else if(toonMode == 1) {
        result = ambient + Q_vec3(diff*use + spec*ular);
    }
    else if(toonMode == 2) {
        result = Q_vec3(ambient + diff*use + spec*ular);
    }
    else if(toonMode == 3) {
        result = ambient + Q(diff*use + spec*ular);
    }
    else if(toonMode == 4) {
        result = Q(ambient + diff*use + spec*ular);
    }
    FragColor = vec4(result, 1.0);
} 