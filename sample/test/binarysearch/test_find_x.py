"""
Find x such that x^2 == n
"""

### __FRONT_TEXT_END__
import pytest


def find_x(n):  # O(log(N))
    lo, hi = 0, 2**32
    while lo <= hi:
        mi = (lo + hi) // 2
        r = mi * mi
        if r == n:
            return mi
        elif r < n:
            lo = mi + 1
        else:
            hi = mi - 1
    return None


def find_x_naive(n):  # O(N)
    for x in range(n + 1):
        if x * x == n:
            return x
    return None


@pytest.mark.parametrize(
    "args,expected",
    [
        [[0], 0],
        [[1], 1],
        [[8], None],
        [[9], 3],
        [[10], None],
        [[(n := 123) * n - 1], None],
        [[n * n], n],
        [[n * n + 1], None],
    ],
)
def test(args, expected):
    assert find_x(*args) == expected
    assert find_x_naive(*args) == expected
