"""
Given an array of numbers, return the length of the longest increasing subsequence (LIS)
in which the elements are in strictly increasing order.
"""

### __FRONT_TEXT_END__
import pytest
from bisect import bisect_left


def lis(nums):
    dp = []
    for n in nums:
        i = bisect_left(dp, n)
        if i == len(dp):
            dp.append(n)
        else:
            dp[i] = n
    return len(dp)


@pytest.mark.parametrize(
    "args,expected",
    [
        [[1], 1],
        [[3, 2, 5, 1, 3, 1, 7, 4], 3],  # [3, 5, 7]
        [[4, 2, 3, 1, 5], 3],  # [2, 3, 6]
    ],
)
def test(args, expected):
    assert lis(args) == expected
