#ifdef GL_ES
	precision highp float;
#endif
/*
32-bit integers are represented by a vec2. GLSL 2 integers may only have up
to 16-bit precision (in portable code), and they are likely to be implemented
with floats anyway. Instead we use float-pairs, with 16-bit in each (although
floats fit 24-bit precision). A vec4 is also used instead of two vec2, where
possible.
*/

uniform vec2 data[16];		/* Second part of data */
uniform vec2 hash1[16];		/* Second part of hash1 */
uniform vec2 midstate[8];
uniform vec2 target[8];
uniform vec2 nonce_base;
uniform vec2 H[8];
uniform vec2 K[64];

/* Note: N is the width of the buffer and should only be between 1 and 2048 or
so. Preferably less -- around 128 or 256. */
uniform float N;

#define Ox10000 65536.0
#define Ox8000  32768.0

vec4 toRGBA(vec2 arg) {
      float V = float(arg.x);
      float R = floor(V / pow(2.0, 8.0));
      V -= R * pow(2.0, 8.0);
      float G = V;
      V = float(arg.y);
      float B = floor(V / pow(2.0, 8.0));
      V -= B * pow(2.0, 8.0);
      float A = V;
      return vec4(R/255., G/255., B/255., A/255.);
}

vec4 toRGBA(float V) {
      float R = V / pow(2.0, 24.0);
      V -= floor(R) *  pow(2.0, 24.0);
      float G = V / pow(2.0, 16.0);
      V -= floor(G) *  pow(2.0, 16.0);
      float B = V / pow(2.0, 8.0);
      V -= floor(B) * pow(2.0, 8.0);;
      float A = V;
      return vec4(R/255., G/255., B/255., A/255.);
}

vec2 safe_add (vec2 a, vec2 b)
{
      vec2 ret;
      ret.x = a.x + b.x;
      ret.y = a.y + b.y;
      if (ret.y >= float(Ox10000)) {
          ret.y -= float(Ox10000);
          ret.x += 1.0;
      }
      if (ret.x >= float(Ox10000)) {
          ret.x -= float(Ox10000);
      }
      return ret;
}
/* Note: shift should be a power of two, e.g. to shift 3 steps, use 2^3. */
vec2 sftr (vec2 a, float shift)
{
      vec2 ret = a / shift;
      ret = vec2 (floor (ret.x), floor (ret.y) + fract (ret.x) * float (Ox10000));
      return ret;
}

/* For rotr (>>) use division with appropriate power of 2. */
/* Note: shift should be a power of two, e.g. to rotate 3 steps, use 2^3. */
vec2 rotr (vec2 a, float shift)
{
      vec2 ret = a / shift;
      ret = floor (ret) + fract (ret.yx) * float (Ox10000);
      return ret;
}

float axor16 (float a, float b)
{
	float ret = float(0);
        float fact = float (Ox8000);
        const int maxi = 16;
        float v1, v2;
        
	for (int i=0; i < maxi; i++)
	{
            v1 = step(fact, a);
            v2 = step(fact, b);
            ret += (v1*(1.-v2) + v2*(1.-v1)) * fact;
            if (v1 == 1.) a -= fact;
            if (v2 == 1.) b -= fact;
	    fact /= 2.0;
	}
	return ret;
}

float aand16 (float a, float b)
{
	float ret = float(0);
	float fact = float (Ox8000);
        const int maxi = 16;
        float v1, v2;

	for (int i=0; i < maxi; i++)
	{
            v1 = step(fact, a);
            v2 = step(fact, b);
            ret += (v1*v2) * fact;
            if (v1 == 1.) a -= fact;
            if (v2 == 1.) b -= fact;
	    fact /= 2.0;
	}
	return ret;
}

float xor16 (float a, float b)
{
	float ret = float(0);
        float fact = float (Ox8000);
        const int maxi = 16;

	for (int i=0; i < maxi; i++)
	{
            if ((max(a,b) >= fact) && (min(a,b) < fact))
		ret += fact;

	    if (a >= fact)
		a -= fact;
	    if (b >= fact)
		b -= fact;

	    fact /= 2.0;
	}
	return ret;
}

vec2 xor (vec2 a, vec2 b)
{
	return vec2 (xor16 (a.x, b.x), xor16 (a.y, b.y));
}

float and16 (float a, float b)
{
	float ret = float(0);
	float fact = float (Ox8000);
        const int maxi = 16;

	for (int i=0; i < maxi; i++)
	{
            if (min(a, b) >= fact)
                ret += fact;

            if (a >= fact)
		a -= fact;
            if (b >= fact)
		b -= fact;

            fact /= 2.0;
	}
	return ret;
}

vec2 and (vec2 a, vec2 b)
{
      return vec2 (and16 (a.x, b.x), and16 (a.y, b.y));
}

/* Logical complement ("not") */
vec2 cpl (vec2 a)
{
      return vec2 (float (Ox10000), float (Ox10000)) - a - vec2(1.0, 1.0);
}
#define POW_2_01 2.0
#define POW_2_02 4.0
#define POW_2_03 8.0
#define POW_2_06 64.0
#define POW_2_07 128.0
#define POW_2_09 512.0
#define POW_2_10 1024.0
#define POW_2_11 2048.0
#define POW_2_13 8192.0

vec2 blend (vec2 m16, vec2 m15, vec2 m07, vec2 m02)
{
      vec2 s0 = xor (rotr (m15   , POW_2_07), xor (rotr (m15.yx, POW_2_02), sftr (m15, POW_2_03)));
      vec2 s1 = xor (rotr (m02.yx, POW_2_01), xor (rotr (m02.yx, POW_2_03), sftr (m02, POW_2_10)));
      return safe_add (safe_add (m16, s0), safe_add (m07, s1));
}

vec2 e0 (vec2 a)
{
	return xor (rotr (a, POW_2_02), xor (rotr (a, POW_2_13), rotr (a.yx, POW_2_06)));
}

vec2 e1 (vec2 a)
{
	return xor (rotr (a, POW_2_06), xor (rotr (a, POW_2_11), rotr (a.yx, POW_2_09)));
}

vec2 ch (vec2 a, vec2 b, vec2 c)
{
	return xor (and (a, b), and (cpl (a), c));
}

vec2 maj (vec2 a, vec2 b, vec2 c)
{
	return xor (xor (and (a, b), and (a, c)), and (b, c));
}

void main ()
{
    const int nonces_per_pixel = 1;

    vec2 ret = vec2 (0., 0.);
    vec2 nonce;
    vec2 w[64];
    vec2 hash[16];
    vec2 tmp[8]; //state
    vec2 udata[16];
    float carry;

    vec2 a, b, c, d, e, f, g, h;
    vec2 t1, t2;
    vec2 _s0,_maj,_t2,_s1,_ch, _t1;
    float x_off = floor(float(gl_FragCoord.x));
    float nonce_off = x_off * float(nonces_per_pixel);

    for (int i=0; i<16; i++) {
        udata[i] = data[i];
    }

    for (int n = 0; n < nonces_per_pixel; n++) {
        nonce = safe_add(vec2 (0., nonce_off + float(n)), nonce_base);

        udata[3] = nonce;

        // Reset
            for (int i=0; i<8; i++) {
                tmp[i] = H[i];
            }
            // TODO: check if needed
            /*for (int i = 0; i < 64; i++) {
                w[i] = vec2(0., 0.);
            }*/


        // update(midstate, udata)
            // set state(midstate)
            for (int i=0; i<8; i++) {
                tmp[i] = midstate[i];
            }
            // extend work (w, udata)
            for (int i=0; i<16; i++) {
                w[i] = udata[i];
            }

            for (int i = 16; i < 64; ++i) {
		w[i] = blend(w[i-16], w[i-15], w[i-7], w[i-2]);
            }

        // var s = this.state;

        a = tmp[0];
        b = tmp[1];
        c = tmp[2];
        d = tmp[3];
        e = tmp[4];
        f = tmp[5];
        g = tmp[6];
        h = tmp[7];

        for (int i = 0; i < 64; i++) {
            _s0 = e0(a);
            _maj = maj(a,b,c);
            _t2 = safe_add(_s0, _maj);
            _s1 = e1(e);
            _ch = ch(e, f, g);
            _t1 = safe_add(safe_add(safe_add(safe_add(h, _s1), _ch), K[i]), w[i]);

            h = g; g = f; f = e;
            e = safe_add(d, _t1);
            d = c; c = b; b = a;
            a = safe_add(_t1, _t2);
	}

        tmp[0] = safe_add(a, tmp[0]);
        tmp[1] = safe_add(b, tmp[1]);
        tmp[2] = safe_add(c, tmp[2]);
        tmp[3] = safe_add(d, tmp[3]);
        tmp[4] = safe_add(e, tmp[4]);
        tmp[5] = safe_add(f, tmp[5]);
        tmp[6] = safe_add(g, tmp[6]);
        tmp[7] = safe_add(h, tmp[7]);

        for (int i = 0; i < 8; i++) {
            hash[i] = tmp[i];
        }
        for (int i = 8; i < 16; i++) {
            hash[i] = hash1[i];
        }

        // Reset
            for (int i=0; i<8; i++) {
                tmp[i] = H[i];
            }
            // TODO: check if needed
            /* for (int i = 0; i < 64; i++) {
                w[i] = vec2(0., 0.);
            } */

        // update(hash)
            // extend work (w, hash)
            for (int i=0; i<16; i++) {
                w[i] = hash[i];
            }
            for (int i = 16; i < 64; ++i) {
		w[i] = blend(w[i-16], w[i-15], w[i-7], w[i-2]);
            }

        // var s = this.state;
        a = tmp[0];
        b = tmp[1];
        c = tmp[2];
        d = tmp[3];
        e = tmp[4];
        f = tmp[5];
        g = tmp[6];
        h = tmp[7];

        for (int i = 0; i < 64; i++) {
            _s0 = e0(a);
            _maj = maj(a,b,c);
            _t2 = safe_add(_s0, _maj);
            _s1 = e1(e);
            _ch = ch(e, f, g);
            _t1 = safe_add(safe_add(safe_add(safe_add(h, _s1), _ch), K[i]), w[i]);

            h = g; g = f; f = e;
            e = safe_add(d, _t1);
            d = c; c = b; b = a;
            a = safe_add(_t1, _t2);
	}

        // tmp[0] = safe_add(a, tmp[0]);
        // tmp[1] = safe_add(b, tmp[1]);
        // tmp[2] = safe_add(c, tmp[2]);
        // tmp[3] = safe_add(d, tmp[3]);
        // tmp[4] = safe_add(e, tmp[4]);
        // tmp[5] = safe_add(f, tmp[5]);
        // tmp[6] = safe_add(g, tmp[6]);
        tmp[7] = safe_add(h, tmp[7]);

        if (nonces_per_pixel != 1 && tmp[7].x == 0. && tmp[7].y == 0.) {
            if (n <= 15) {
                ret = safe_add(ret, vec2(0., pow(2.0, float(n))));
            } else {
                ret = safe_add(ret, vec2(pow(2.0, float(n - 16)), 0.));
            }
        // } else {
            // gl_FragColor = vec4(1., 1., 1., 1.);
        }

	/* TODO: Compare with target. */
    }
    if (nonces_per_pixel == 1) {
        gl_FragColor = toRGBA( tmp[7]);
    } else {
        gl_FragColor = toRGBA(ret);
    }
}
